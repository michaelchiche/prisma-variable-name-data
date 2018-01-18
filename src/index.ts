import { GraphQLServer } from 'graphql-yoga';
import { importSchema } from 'graphql-import';
import {
  Prisma,
  PostCreateWithoutAuthorInput,
  PostCreateInput,
} from './generated/prisma';
import { Context } from './utils';

function createPost(
  parent,
  post: PostCreateWithoutAuthorInput,
  context: Context,
  info,
) {
  const p: PostCreateInput = {
    ...post,
    author: {
      connect: {
        slug: 'michael',
      },
    },
  };
  return context.db.mutation.createPost({ data: p }, info);
}
const resolvers = {
  Query: {
    feed(parent, args, context: Context, info) {
      return context.db.query.posts({ where: { isPublished: true } }, info);
    },
    drafts(parent, args, context: Context, info) {
      return context.db.query.posts({ where: { isPublished: false } }, info);
    },
    post(parent, { id }, context: Context, info) {
      return context.db.query.post({ where: { id: id } }, info);
    },
  },
  Mutation: {
    createDraft(parent, { title, text }, context: Context, info) {
      return context.db.mutation.createPost({ data: { title, text } }, info);
    },
    deletePost(parent, { id }, context: Context, info) {
      return context.db.mutation.deletePost({ where: { id } }, info);
    },
    publish(parent, { id }, context: Context, info) {
      return context.db.mutation.updatePost(
        {
          where: { id },
          data: { isPublished: true },
        },
        info,
      );
    },
    createPostOK(
      parent,
      { post }: { post: PostCreateWithoutAuthorInput },
      context: Context,
      info,
    ) {
      return createPost(parent, post, context, info);
    },
    createPostKO(
      parent,
      { data }: { data: PostCreateWithoutAuthorInput },
      context: Context,
      info,
    ) {
      return createPost(parent, data, context, info);
    },
  },
};

const server = new GraphQLServer({
  typeDefs: './src/schema.graphql',
  resolvers,
  context: req => ({
    ...req,
    db: new Prisma({
      endpoint: 'http://localhost:4466/variable-data/dev', // the endpoint of the Prisma DB service
      secret: 'mysecret123', // specified in database/prisma.yml
      debug: true, // log all GraphQL queries & mutations
    }),
  }),
});

server.start(() => console.log('Server is running on http://localhost:4000'));
