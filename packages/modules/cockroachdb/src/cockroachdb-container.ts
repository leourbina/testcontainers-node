import { AbstractStartedContainer, GenericContainer, StartedTestContainer, Wait } from "testcontainers";

const COCKROACH_PORT = 26257;

export class CockroachDbContainer extends GenericContainer {
  private database = "test";
  private username = "test";

  constructor(image = "cockroachdb/cockroach:v24.3.5") {
    super(image);
    this.withExposedPorts(COCKROACH_PORT)
      .withCommand(["start-single-node", "--insecure"])
      .withWaitStrategy(Wait.forLogMessage(/.*end running init files.*/, 1))
      .withStartupTimeout(120_000);
  }

  public withDatabase(database: string): this {
    this.database = database;
    return this;
  }

  public withUsername(username: string): this {
    this.username = username;
    return this;
  }

  public override async start(): Promise<StartedCockroachDbContainer> {
    this.withEnvironment({
      COCKROACH_DATABASE: this.database,
      COCKROACH_USER: this.username,
    });
    return new StartedCockroachDbContainer(await super.start(), this.database, this.username);
  }
}

export class StartedCockroachDbContainer extends AbstractStartedContainer {
  private readonly port: number;

  constructor(
    startedTestContainer: StartedTestContainer,
    private readonly database: string,
    private readonly username: string
  ) {
    super(startedTestContainer);
    this.port = startedTestContainer.getMappedPort(COCKROACH_PORT);
  }

  public getPort(): number {
    return this.port;
  }

  public getDatabase(): string {
    return this.database;
  }

  public getUsername(): string {
    return this.username;
  }

  /**
   * @returns A connection URI in the form of `postgres[ql]://[username[:password]@][host[:port],]/database`
   */
  public getConnectionUri(): string {
    const url = new URL("", "postgres://");
    url.hostname = this.getHost();
    url.port = this.getPort().toString();
    url.pathname = this.getDatabase();
    url.username = this.getUsername();
    return url.toString();
  }
}
