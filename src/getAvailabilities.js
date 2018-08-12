import moment from 'moment'
import knex from 'knexClient'

export default async function getAvailabilities(date) {
  return [
    {date: new Date('2014-08-10'), slots: []},
    {date: new Date('2014-08-11'), slots: ['9:30', '10:00', '11:30', '12:00']},
    {slots: []},
    null,
    null,
    null,
    {date: new Date('2014-08-16')},
  ]
}
