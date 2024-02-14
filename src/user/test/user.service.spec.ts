import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from '../user.service';
import { mock } from 'jest-mock-extended';
import { User } from '../../database/entities';
import { Repository } from 'typeorm';
import { faker } from '@faker-js/faker';
import { RegisterDto } from '../../common/dto';

const userRepository = mock<Repository<User>>();

describe('UserService', () => {
  let userService: UserService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: 'UserRepository', useValue: userRepository },
      ],
    }).compile();

    userService = module.get<UserService>(UserService);
  });

  it('Should be defined', () => {
    expect(userService).toBeDefined();
  });
});

describe('UserService.getProfile()', () => {
  let userService: UserService;

  let userObject: Partial<User>;

  beforeEach(() => {
    jest.clearAllMocks();

    userObject = {
      id: faker.number.int({ min: 1, max: 100 }),
      username: faker.internet.userName(),
      name: faker.person.firstName(),
      surname: faker.person.lastName(),
      createdAt: faker.date.past(),
      updatedAt: faker.date.past(),
    };
  });

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: 'UserRepository', useValue: userRepository },
      ],
    }).compile();

    userService = module.get<UserService>(UserService);
  });

  it('Should return User', async () => {
    jest
      .spyOn(userRepository, 'findOneBy')
      .mockResolvedValue(userObject as User);

    const result = await userService.getProfile({
      id: userObject.id,
      username: userObject.username,
    });

    expect(result).toEqual(userObject);
  });

  it('Should return null', async () => {
    jest.spyOn(userRepository, 'findOneBy').mockResolvedValue(null);

    const result = await userService.getProfile({
      id: userObject.id,
      username: userObject.username,
    });

    expect(result).toBeNull();
  });
});

describe('UserService.registerUser()', () => {
  let userService: UserService;

  let userObject: Partial<User>;
  let registerDto: RegisterDto;

  beforeEach(() => {
    jest.clearAllMocks();

    userObject = {
      id: faker.number.int({ min: 1, max: 100 }),
      username: faker.internet.userName(),
      name: faker.person.firstName(),
      surname: faker.person.lastName(),
      createdAt: faker.date.past(),
      updatedAt: faker.date.past(),
    };

    registerDto = {
      username: faker.internet.userName(),
      password: faker.internet.password(),
      name: faker.person.firstName(),
      surname: faker.person.lastName(),
    };
  });

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: 'UserRepository', useValue: userRepository },
      ],
    }).compile();

    userService = module.get<UserService>(UserService);
  });

  it('Should return ApiResponse', async () => {
    jest.spyOn(userRepository, 'findOneBy').mockResolvedValue(null);

    const response = await userService.registerUser(registerDto);

    expect(response).toEqual({
      message: 'USER_SUCCESSFULLY_REGISTERED',
      date: expect.any(Date),
    });
  });

  it('Should trow ConflictException', () => {
    jest
      .spyOn(userRepository, 'findOneBy')
      .mockResolvedValue(userObject as User);

    expect(userService.registerUser(registerDto)).rejects.toThrow(
      'USERNAME_ALREADY_TAKEN',
    );
  });
});

describe('UserService.isUsernameTaken()', () => {
  let userService: UserService;

  let userObject: Partial<User>;

  type privateFunc = (username: string) => Promise<boolean>;

  beforeEach(() => {
    jest.clearAllMocks();

    userObject = {
      id: faker.number.int({ min: 1, max: 100 }),
      username: faker.internet.userName(),
      name: faker.person.firstName(),
      surname: faker.person.lastName(),
      createdAt: faker.date.past(),
      updatedAt: faker.date.past(),
    };
  });

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: 'UserRepository', useValue: userRepository },
      ],
    }).compile();

    userService = module.get<UserService>(UserService);
  });

  it('Should return true', async () => {
    jest
      .spyOn(userRepository, 'findOneBy')
      .mockResolvedValue(userObject as User);

    const isUsernameTaken: privateFunc =
      userService['isUsernameTaken'].bind(userService);

    const response = await isUsernameTaken(userObject.username);

    expect(response).toBeTruthy();
  });

  it('Should return false', async () => {
    jest.spyOn(userRepository, 'findOneBy').mockResolvedValue(null);

    const isUsernameTaken: privateFunc =
      userService['isUsernameTaken'].bind(userService);

    const response = await isUsernameTaken(userObject.username);

    expect(response).toBeFalsy();
  });
});

describe('UserService.isUserExists()', () => {
  let userService: UserService;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: 'UserRepository', useValue: userRepository },
      ],
    }).compile();

    userService = module.get<UserService>(UserService);
  });

  it('Should return true', async () => {
    jest.spyOn(userRepository, 'findOneBy').mockResolvedValue({} as User);

    const response = await userService.isUserExists(
      faker.number.int(),
      faker.internet.userName(),
    );

    expect(response).toBeTruthy();
  });

  it('Should return false', async () => {
    jest.spyOn(userRepository, 'findOneBy').mockResolvedValue(null);

    const response = await userService.isUserExists(
      faker.number.int(),
      faker.internet.userName(),
    );

    expect(response).toBeFalsy();
  });
});

describe('UserService.getUserByUsername()', () => {
  let userService: UserService;

  let userObject: Partial<User>;

  let username: string;

  beforeEach(() => {
    jest.clearAllMocks();

    username = faker.internet.userName();

    userObject = {
      id: faker.number.int({ min: 1, max: 100 }),
      username,
      password: faker.internet.password(),
    };
  });

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: 'UserRepository', useValue: userRepository },
      ],
    }).compile();

    userService = module.get<UserService>(UserService);
  });

  it('Should return User', async () => {
    jest.spyOn(userRepository, 'findOne').mockResolvedValue(userObject as User);

    const response = await userService.getUserByUsername(username);

    expect(response).toEqual(userObject);
  });

  it('Should return null', async () => {
    jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

    const username = faker.internet.userName();

    const response = await userService.getUserByUsername(username);

    expect(response).toBeNull();
  });
});
