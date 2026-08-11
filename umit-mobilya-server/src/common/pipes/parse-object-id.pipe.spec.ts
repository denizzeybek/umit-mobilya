import { BadRequestException } from '@nestjs/common';

import { ParseObjectIdPipe } from './parse-object-id.pipe';

/*
 * Without this pipe a malformed id reaches mongoose, which throws CastError
 * from inside the service — an unhandled error, so the global filter answers
 * 500. The Express version answered 400 because it caught everything. 400 is
 * also simply correct: a malformed id is bad input, not a server fault.
 */
describe('ParseObjectIdPipe', () => {
  const pipe = new ParseObjectIdPipe();

  it('passes a valid ObjectId through unchanged', () => {
    const id = '507f1f77bcf86cd799439011';

    expect(pipe.transform(id)).toBe(id);
  });

  it('rejects a string that is not an ObjectId', () => {
    expect(() => pipe.transform('not-an-id')).toThrow(BadRequestException);
  });

  it('names the offending value so the caller can see what was wrong', () => {
    expect(() => pipe.transform('not-an-id')).toThrow(
      'Geçersiz id: not-an-id',
    );
  });

  it('rejects a 24-character string that is not hex', () => {
    expect(() => pipe.transform('zzzzzzzzzzzzzzzzzzzzzzzz')).toThrow(
      BadRequestException,
    );
  });

  it('rejects an empty string', () => {
    expect(() => pipe.transform('')).toThrow(BadRequestException);
  });
});
