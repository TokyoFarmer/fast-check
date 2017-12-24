import { ArbitraryWithShrink } from './definition/Arbitrary'
import Shrinkable from './definition/Shrinkable'
import UniformDistribution from '../../random/distribution/UniformDistribution'
import MutableRandomGenerator from '../../random/generator/MutableRandomGenerator'
import { stream, Stream } from '../../stream/Stream'

class IntegerArbitrary extends ArbitraryWithShrink<number> {
    static MIN_INT: number = 0x80000000 | 0;
    static MAX_INT: number = 0x7fffffff | 0;

    readonly min: number;
    readonly max: number;
    constructor(min?: number, max?: number) {
        super();
        this.min = min === undefined ? IntegerArbitrary.MIN_INT : min;
        this.max = max === undefined ? IntegerArbitrary.MAX_INT : max;
    }
    private wrapper(value: number): Shrinkable<number> {
        return new Shrinkable(value, () => this.shrink(value).map(v => this.wrapper(v)));
    }
    generate(mrng: MutableRandomGenerator): Shrinkable<number> {
        return this.wrapper(this.generateImpl(mrng));
    }
    private generateImpl(mrng: MutableRandomGenerator): number {
        return UniformDistribution.inRange(this.min, this.max)(mrng)[0];
    }
    private shrink_to(value: number, target: number): Stream<number> {
        const gap = value - target;
        function* shrink_decr(): IterableIterator<number> {
            for (let toremove = gap ; toremove > 0 ; toremove = Math.floor(toremove/2)) {
                yield (value - toremove);
            }
        }
        function* shrink_incr(): IterableIterator<number> {
            for (let toremove = gap ; toremove < 0 ; toremove = Math.ceil(toremove/2)) {
                yield (value - toremove);
            }
        }
        return gap > 0 ? stream(shrink_decr()) : stream(shrink_incr());
    }
    shrink(value: number): Stream<number> {
        if (this.min <= 0 && this.max >= 0) {
            return this.shrink_to(value, 0);
        }
        return value < 0 ? this.shrink_to(value, this.max) : this.shrink_to(value, this.min);
    }
}

function integer(): ArbitraryWithShrink<number>;
function integer(max: number): ArbitraryWithShrink<number>;
function integer(min: number, max: number): ArbitraryWithShrink<number>;
function integer(a?: number, b?: number): ArbitraryWithShrink<number> {
    return b === undefined
        ? new IntegerArbitrary(undefined, a)
        : new IntegerArbitrary(a, b);
}

function nat(): ArbitraryWithShrink<number>;
function nat(max: number): ArbitraryWithShrink<number>;
function nat(a?: number): ArbitraryWithShrink<number> {
    return new IntegerArbitrary(0, a);
}

export { integer, nat };
