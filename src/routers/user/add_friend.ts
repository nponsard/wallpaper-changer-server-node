import { FastifyReply, FastifyRequest, RouteShorthandOptions } from 'fastify';
import { Static, Type } from '@sinclair/typebox';
import { checkUser } from '../../jwt/check';
import { messageResponse } from '../common';
import { FriendRequest, FriendRequestStatus } from '../../entities/friendRequest';
import { AppDataSource } from '../../data-source';
import { User } from '../../entities/user';

const params = Type.Object({
  username: Type.String(),
});

type ParamsType = Static<typeof params>;

export const addFriendOptions: RouteShorthandOptions = {
  schema: {
    tags: ['User'],
    description: 'Send a friend request to a user, or accept a friend request from a user',
    security: [{ jwt: [] }],
    params,
    response: {
      200: messageResponse,
    },
  },
};

export async function addFriendHandler(request: FastifyRequest<{ Params: ParamsType }>, reply: FastifyReply) {
  const user = await checkUser(request.headers.authorization);
  if (!user) {
    reply.status(401).send({ message: 'Unauthorized' });
    return;
  }

  const targetUser = await AppDataSource.getRepository(User).findOne({
    where: { username: request.params.username },
  });

  if (!targetUser) {
    reply.status(404).send({ message: 'User not found' });
    return;
  }

  console.log('checking if friend request already exists');

  const exists = await AppDataSource.getRepository(FriendRequest)
    .createQueryBuilder('friend_request')
    .where('friend_request.from = :fromUser', { fromUser: user.id })
    .andWhere('friend_request.to = :toUser', { toUser: targetUser.id })
    .getOne();

  if (exists) {
    reply.status(400).send({ message: 'Friend request already sent' });
    return;
  }

  console.log('checking if friend request already exists, inverse');

  const reverse = await AppDataSource.getRepository(FriendRequest)
    .createQueryBuilder('friend_request')
    .where('friend_request.from = :fromUser', { fromUser: targetUser.id })
    .andWhere('friend_request.to = :toUser', { toUser: user.id })
    .getOne();

  if (reverse) {
    reverse.status = FriendRequestStatus.ACCEPTED;
    reverse.save();
  } else {
    const friendRequest = new FriendRequest();
    friendRequest.from = user;
    friendRequest.to = targetUser;
    friendRequest.status = FriendRequestStatus.PENDING;
    friendRequest.save();
  }

  reply.status(200).send({ message: 'ok' });
}
