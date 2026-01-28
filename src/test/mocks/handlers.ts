import { http, HttpResponse } from 'msw';



const BASE_URL = 'https://jsonplaceholder.typicode.com';

export const handlers = [
  // Mock GET /posts endpoint
  http.get(`${BASE_URL}/posts`, () => {
    return HttpResponse.json([
      {
        id: 1,
        userId: 1,
        title: 'Test Post 1',
        body: 'This is a test post body',
      },
      {
        id: 2,
        userId: 1,
        title: 'Test Post 2',
        body: 'This is another test post body',
      },
    ]);
  }),

  // Mock GET /posts/:id endpoint
  http.get(`${BASE_URL}/posts/:id`, ({ params }) => {
    const { id } = params;
    return HttpResponse.json({
      id: Number(id),
      userId: 1,
      title: `Test Post ${id}`,
      body: 'This is a test post body',
    });
  }),

  // Mock POST /posts endpoint
  http.post(`${BASE_URL}/posts`, async ({ request }) => {
    const body = (await request.json()) as any;
    return HttpResponse.json(
      {
        id: 101,
        ...body,
      },
      { status: 201 }
    );
  }),

  // Mock GET /comments endpoint
  http.get(`${BASE_URL}/comments`, () => {
    return HttpResponse.json([
      {
        id: 1,
        postId: 1,
        name: 'Test Comment',
        email: 'test@example.com',
        body: 'This is a test comment',
      },
    ]);
  }),

  // Mock GET /users endpoint
  http.get(`${BASE_URL}/users`, () => {
    return HttpResponse.json([
      {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        name: 'Test User',
      },
    ]);
  }),
];

// Error handlers for testing error scenarios
export const errorHandlers = [
  // Network error
  http.get(`${BASE_URL}/posts`, () => {
    return HttpResponse.error();
  }),

  // 500 Server error
  http.get(`${BASE_URL}/posts`, () => {
    return HttpResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }),

  // 401 Unauthorized
  http.get(`${BASE_URL}/posts`, () => {
    return HttpResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }),
];
