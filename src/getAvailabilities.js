import moment from 'moment';
import knex from 'knexClient';

export default async function getAvailabilities(start_date_string) {
  const date_format = 'YYYY-MM-DD';
  const time_format = 'H:mm';
  const date_time_format = 'YYYY-MM-DD HH:mm';

  let start_date = moment(start_date_string).startOf('day');
  let end_date = start_date.clone().add(7, 'days');
  let end_date_string = end_date.format(date_format);

  let agenda = initialiseAgenda();
  let appointment_times = await getAppointmentTimes();
  await addOpenings();

  return agenda;

  function initialiseAgenda() {
    let agenda = [];
    for (let day = 0; day < 7; ++day) {
      let agenda_day = start_date.clone().add(day, 'days').format(date_format);
      agenda.push({date: new Date(agenda_day), slots: []});
    }
    return agenda;
  }

  async function getAppointmentTimes() {
    let appointments = await getAppointments();
    let appointment_times = {};

    for (let i = 0; i < appointments.length; i++) {
      let appointment_starts_at = moment(appointments[i].starts_at);
      let appointment_ends_at = moment(appointments[i].ends_at);

      let period = appointment_ends_at.diff(appointment_starts_at, 'minutes');
      for (let minutes = 0; minutes < period; minutes += 30) {
        let appointment = appointment_starts_at.clone().add(minutes, 'minutes');
        appointment_times[appointment.format(date_time_format)] = true;
      }
    }

    return appointment_times;
  }

  async function getAppointments() {
    return knex('events').where({kind: 'appointment'}).andWhere((builder) =>
      builder.where((builder) =>
        builder.where('starts_at', '>=', start_date_string).where('starts_at', '<', end_date_string)
      ).orWhere((builder) =>
        builder.where({weekly_recurring: true}).where('starts_at', '<', end_date_string)
      )
    );
  }

  async function addOpenings() {
    let openings = await getOpenings();

    for (let i = 0; i < openings.length; i++) {
      let opening_starts_at = moment(openings[i].starts_at);
      let opening_ends_at = moment(openings[i].ends_at);

      let days_offset_this_week = (opening_starts_at.diff(start_date, 'days') % 7 + 7) % 7;
      let opening_date_this_week = start_date.clone().add(days_offset_this_week, 'days');
      let days_offset = opening_date_this_week.diff(opening_starts_at, 'days');

      let opening_starts_at_this_week = opening_starts_at.clone().add(days_offset, 'days');
      let opening_ends_at_this_week = opening_ends_at.clone().add(days_offset, 'days');

      let period = opening_ends_at_this_week.diff(opening_starts_at_this_week, 'minutes');
      for (let minutes = 0; minutes < period; minutes += 30) {
        let opening = opening_starts_at_this_week.clone().add(minutes, 'minutes');
        let days = opening.diff(start_date, 'days');
        if (days < 7 && !appointment_times[opening.format(date_time_format)]) {
          agenda[days].slots.push(opening.format(time_format));
        }
      }
    }
  }

  async function getOpenings() {
    return knex('events').where({kind: 'opening'}).andWhere((builder) =>
      builder.where((builder) =>
        builder.where('starts_at', '>=', start_date_string).where('starts_at', '<', end_date_string)
      ).orWhere((builder) =>
        builder.where({weekly_recurring: true}).where('starts_at', '<', end_date_string)
      )
    );
  }
}
