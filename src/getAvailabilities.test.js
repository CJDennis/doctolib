import knex from 'knexClient'
import getAvailabilities from './getAvailabilities'

describe('getAvailabilities', () => {
  beforeEach(() => knex('events').truncate());

  describe('simple case', () => {
    beforeEach(async () => {
      await knex('events').insert([
        {
          kind: 'opening',
          starts_at: new Date('2014-08-04 09:30'),
          ends_at: new Date('2014-08-04 12:30'),
          weekly_recurring: true,
        },
        {
          kind: 'appointment',
          starts_at: new Date('2014-08-11 10:30'),
          ends_at: new Date('2014-08-11 11:30'),
        },
      ]);
    });

    it('should fetch availabilities correctly', async () => {
      const availabilities = await getAvailabilities(new Date('2014-08-10'));
      expect(availabilities.length).toBe(7);

      expect(String(availabilities[0].date)).toBe(
        String(new Date('2014-08-10')),
      );
      expect(availabilities[0].slots).toEqual([]);

      expect(String(availabilities[1].date)).toBe(
        String(new Date('2014-08-11')),
      );
      expect(availabilities[1].slots).toEqual([
        '9:30',
        '10:00',
        '11:30',
        '12:00',
      ]);

      expect(availabilities[2].slots).toEqual([]);

      expect(String(availabilities[6].date)).toBe(
        String(new Date('2014-08-16')),
      );
    });

    it('should fetch repeating availabilities correctly', async () => {
      const availabilities = await getAvailabilities(new Date('2014-08-16'));
      expect(availabilities.length).toBe(7);

      expect(String(availabilities[0].date)).toBe(
        String(new Date('2014-08-16')),
      );
      expect(availabilities[0].slots).toEqual([]);

      expect(String(availabilities[1].date)).toBe(
        String(new Date('2014-08-17')),
      );
      expect(availabilities[1].slots).toEqual([]);

      expect(String(availabilities[2].date)).toBe(
        String(new Date('2014-08-18')),
      );
      expect(availabilities[2].slots).toEqual([
        '9:30',
        '10:00',
        '10:30',
        '11:00',
        '11:30',
        '12:00',
      ]);

      expect(availabilities[3].slots).toEqual([]);

      expect(String(availabilities[6].date)).toBe(
        String(new Date('2014-08-22')),
      );
    });
  });

  describe('midnight openings', () => {
    beforeEach(async () => {
      await knex('events').insert([
        {
          kind: 'opening',
          starts_at: new Date('2014-08-10 22:30'),
          ends_at: new Date('2014-08-11 01:30'),
          weekly_recurring: true,
        },
        {
          kind: 'appointment',
          starts_at: new Date('2014-08-10 23:30'),
          ends_at: new Date('2014-08-11 00:30'),
        },
      ]);
    });

    it('should fetch day-spanning availabilities correctly', async () => {
      const availabilities = await getAvailabilities(new Date('2014-08-04'));
      expect(availabilities.length).toBe(7);

      expect(String(availabilities[0].date)).toBe(
        String(new Date('2014-08-04')),
      );
      expect(availabilities[0].slots).toEqual([]);

      expect(String(availabilities[5].date)).toBe(
        String(new Date('2014-08-09')),
      );
      expect(availabilities[5].slots).toEqual([]);

      expect(String(availabilities[6].date)).toBe(
        String(new Date('2014-08-10')),
      );
      expect(availabilities[6].slots).toEqual([
        '22:30',
        '23:00',
      ]);
    });

    it('should fetch repeating day-spanning availabilities correctly', async () => {
      const availabilities = await getAvailabilities(new Date('2014-08-11'));
      expect(availabilities.length).toBe(7);

      expect(String(availabilities[0].date)).toBe(
        String(new Date('2014-08-11')),
      );
      expect(availabilities[0].slots).toEqual([
        '0:30',
        '1:00',
      ]);

      expect(String(availabilities[1].date)).toBe(
        String(new Date('2014-08-12')),
      );
      expect(availabilities[1].slots).toEqual([]);

      expect(String(availabilities[5].date)).toBe(
        String(new Date('2014-08-16')),
      );
      expect(availabilities[5].slots).toEqual([]);

      expect(String(availabilities[6].date)).toBe(
        String(new Date('2014-08-17')),
      );
      expect(availabilities[6].slots).toEqual([
        '22:30',
        '23:00',
        '23:30',
      ]);
    });
  });
});
