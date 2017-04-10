/* globals describe, it */
/* eslint import/no-extraneous-dependencies: off */

const chai = require('chai');
const chance = require('chance').Chance();
const greeter = require('../greeter');

chai.should();

describe('given [context]', () => {
  describe('when [event]', () => {
    it('then [outcome]', () => {
      const name = chance.name();
      greeter(name).should.equal(`Ciao ${name}!`);
    });
  });
});
