export abstract class IRandom {
    public abstract nextInt(bound?: number): number;
    public abstract nextLong(): bigint;
    public abstract nextFloat(): number;
    public abstract nextDouble(): number;
    public abstract nextBoolean(): boolean;
    public abstract nextGaussian(): number;

    public consumeCount(count: number) {
        for (let i = 0; i < count; i++) {
            this.nextInt();
        }
    }

    public abstract fork(): IRandom;
}