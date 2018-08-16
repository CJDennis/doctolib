import moment from 'moment';
import knex from 'knexClient';

export default async function getAvailabilities(start_date) {
  const DATE_FORMAT = 'YYYY-MM-DD';
  const TIME_FORMAT = 'H:mm';
  const DATE_TIME_FORMAT = 'YYYY-MM-DD HH:mm';

  let start_date_moment = moment(start_date).startOf('day');
  let end_date_moment = start_date_moment.clone().add(7, 'days');

  let agenda = initialiseAgenda();
  let appointment_times = await getEventTimes('appointment');
  let opening_times = await getEventTimes('opening');
  addAvailableOpenings();

  return agenda;

  function initialiseAgenda() {
    let agenda = [];
    for (let day = 0; day < 7; ++day) {
      let agenda_day = start_date_moment.clone().add(day, 'days').format(DATE_FORMAT);
      agenda.push({date: new Date(agenda_day), slots: []});
    }
    return agenda;
  }

  async function getEventTimes(event_type) {
    let events = await getEventsOfType(event_type);

    let times = {};
    for (let i = 0; i < events.length; i++) {
      let starts_at = moment(events[i].starts_at);
      let ends_at = moment(events[i].ends_at);
      if (!events[i].weekly_recurring) {
        addToTimes(times, starts_at, ends_at);
      }
      else {
        if (ends_at < start_date_moment) {
          let weeks_to_add = start_date_moment.diff(ends_at, 'weeks') + 1;
          starts_at.add(weeks_to_add, 'weeks');
          ends_at.add(weeks_to_add, 'weeks');
        }

        while (starts_at < end_date_moment) {
          addToTimes(times, starts_at, ends_at);
          starts_at.add(1, 'week');
          ends_at.add(1, 'week');
        }
      }
    }
    return times;
  }

  async function getEventsOfType(event_type) {
    return knex('events').where({kind: event_type}).andWhere((builder) =>
      builder.where((builder) =>
        builder.where('starts_at', '>=', start_date_moment.toDate()).where('starts_at', '<', end_date_moment.toDate())
      ).orWhere((builder) =>
        builder.where('ends_at', '>', start_date_moment.toDate()).where('ends_at', '<=', end_date_moment.toDate())
      ).orWhere((builder) =>
        builder.where({weekly_recurring: true}).where('starts_at', '<', end_date_moment.toDate())
      )
    );
  }

  function addToTimes(times, starts_at, ends_at) {
    let start_time = moment.max(starts_at, start_date_moment);
    let end_time = moment.min(ends_at, end_date_moment);
    let period = end_time.diff(start_time, 'minutes');
    for (let minutes = 0; minutes < period; minutes += 30) {
      let time = start_time.clone().add(minutes, 'minutes');
      times[time.format(DATE_TIME_FORMAT)] = time;
    }
  }

  function addAvailableOpenings() {
    for (let time in opening_times) {
      if (opening_times.hasOwnProperty(time)) {
        if (!appointment_times[time]) {
          let days = Math.floor(opening_times[time].diff(start_date_moment, 'days'));
          agenda[days].slots.push(opening_times[time].format(TIME_FORMAT));
        }
      }
    }
  }
}
