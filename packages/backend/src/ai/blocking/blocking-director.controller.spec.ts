import { GUARDS_METADATA } from '@nestjs/common/constants';
import { AuthGuard } from '@nestjs/passport';
import { BlockingDirectorController } from './blocking-director.controller';

describe('BlockingDirectorController', () => {
  it('requires JWT authentication', () => {
    const guards = Reflect.getMetadata(GUARDS_METADATA, BlockingDirectorController);
    expect(guards).toEqual(expect.arrayContaining([AuthGuard('jwt')]));
  });
});
