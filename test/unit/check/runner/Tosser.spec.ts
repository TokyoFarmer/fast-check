import * as assert from 'assert';
import * as fc from '../../../../lib/fast-check';

import { toss } from '../../../../src/check/runner/Tosser';
import { stream } from '../../../../src/stream/Stream';
import { Arbitrary } from '../../../../src/check/arbitrary/definition/Arbitrary';
import IProperty from '../../../../src/check/property/IProperty';
import Random from '../../../../src/random/generator/Random';

import * as stubArb from '../../stubs/arbitraries';

const wrap = <T>(arb: Arbitrary<T>): IProperty<T> =>
  new class implements IProperty<T> {
    constructor(readonly arb: Arbitrary<T>) {}
    isAsync = () => false;
    generate = (rng: Random) => this.arb.generate(rng);
    run = () => '';
  }(arb);

describe('Tosser', () => {
  describe('toss', () => {
    it('Should offset the random number generator between calls', () =>
      fc.assert(
        fc.property(fc.integer(), fc.nat(100), (seed, start) => {
          const s = stream(toss(wrap(stubArb.forwardArray(4)), seed));
          const [g1, g2] = [
            ...s
              .drop(start)
              .take(2)
              .map(f => f().value)
          ];
          assert.notDeepStrictEqual(g1, g2);
          return true;
        })
      ));
    it('Should produce the same sequence for the same seed', () =>
      fc.assert(
        fc.property(fc.integer(), fc.nat(20), (seed, num) => {
          assert.deepStrictEqual(
            [
              ...stream(toss(wrap(stubArb.forward()), seed))
                .take(num)
                .map(f => f().value)
            ],
            [
              ...stream(toss(wrap(stubArb.forward()), seed))
                .take(num)
                .map(f => f().value)
            ]
          );
        })
      ));
    it('Should not depend on the order of iteration', () =>
      fc.assert(
        fc.property(fc.integer(), fc.nat(20), (seed, num) => {
          const onGoingItems1 = [...stream(toss(wrap(stubArb.forward()), seed)).take(num)];
          const onGoingItems2 = [...stream(toss(wrap(stubArb.forward()), seed)).take(num)];
          assert.deepStrictEqual(
            onGoingItems2
              .reverse()
              .map(f => f().value)
              .reverse(),
            onGoingItems1.map(f => f().value)
          );
        })
      ));
  });
});
