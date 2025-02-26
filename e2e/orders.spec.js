const {
  fetch,
  fetchAsTestUser1,
  fetchAsTestUser2,
  fetchAsAdmin,
} = process;

describe('POST /orders', () => {
  it('should fail with 401 when no auth', () => (
    fetch('/orders', { method: 'POST' })
      .then((resp) => expect(resp.status).toBe(401))
  ));

  it('should fail with 400 when bad props', () => (
    fetchAsTestUser1('/orders', { method: 'POST', body: {} })
      .then((resp) => expect(resp.status).toBe(400))
  ));

  it('should fail with 400 when empty items', () => (
    fetchAsTestUser1('/orders', {
      method: 'POST',
      body: { products: [] },
    })
      .then((resp) => {
        expect(resp.status).toBe(400);
      })
  ));

  it('should create order as user (own order)', () => (
    Promise.all([
      fetchAsAdmin('/products', {
        method: 'POST',
        body: { name: 'Test', price: 10 },
      }),
      fetchAsAdmin('/users/test@test.test'),
    ])
      .then((responses) => {
        expect(responses[0].status).toBe(200);
        expect(responses[1].status).toBe(200);
        return Promise.all([responses[0].json(), responses[1].json()]);
      })
      .then(([product, user]) => fetchAsTestUser1('/orders', {
        method: 'POST',
        body: { products: [{ product: product, qty: 5 }], client: 'Client', userId: user._id },
      }))
      .then((resp) => {
        expect(resp.status).toBe(200);
        return resp.json();
      })
      .then((json) => {
        expect(typeof json._id).toBe('string');
        expect(json.client).toBe('Client');
        expect(typeof json.dateEntry).toBe('string');
        expect(Array.isArray(json.products)).toBe(true);
        expect(json.products.length).toBe(1);
        expect(json.products[0].product.name).toBe('Test');
        expect(json.products[0].product.price).toBe(10);
      })
  ));

  it('should create order as admin', () => (
    Promise.all([
      fetchAsAdmin('/products', {
        method: 'POST',
        body: { name: 'Test1', price: 25 },
      }),
      fetchAsAdmin('/users/test@test.test'),
    ])
      .then((responses) => {
        expect(responses[0].status).toBe(200);
        expect(responses[1].status).toBe(200);
        return Promise.all([responses[0].json(), responses[1].json()]);
      })
      .then(([product, user]) => fetchAsAdmin('/orders', {
        method: 'POST',
        body: { products: [{ product: product, qty: 25 }], client: 'Client1', userId: user._id },
      }))
      .then((resp) => {
        expect(resp.status).toBe(200);
        return resp.json();
      })
      .then((json) => {
        expect(typeof json._id).toBe('string');
        expect(typeof json.dateEntry).toBe('string');
        expect(Array.isArray(json.products)).toBe(true);
        expect(json.products.length).toBe(1);
        expect(json.products[0].product.name).toBe('Test1');
        expect(json.products[0].product.price).toBe(25);
      })
  ));
});

describe('GET /orders', () => {
  it('should fail with 401 when no auth', () => (
    fetch('/orders')
      .then((resp) => expect(resp.status).toBe(401))
  ));

  it('should get orders as user', () => (
    Promise.all([
      fetchAsAdmin('/products', {
        method: 'POST',
        body: { name: 'Test2', price: 10 },
      }),
      fetchAsAdmin('/users/test@test.test'),
    ])
      .then((responses) => {
        expect(responses[0].status).toBe(200);
        expect(responses[1].status).toBe(200);
        return Promise.all([responses[0].json(), responses[1].json()]);
      })
      .then(([product, user]) => (
        Promise.all([
          fetchAsTestUser1('/orders', {
            method: 'POST',
            body: { products: [{ product: product, qty: 50 }], client: 'Client3', userId: user._id },
          }),
          fetchAsAdmin('/orders', {
            method: 'POST',
            body: { products: [{ product: product, qty: 25 }], client: 'Client4', userId: user._id },
          }),
        ])
          .then((responses) => {
            expect(responses[0].status).toBe(200);
            expect(responses[1].status).toBe(200);
            return fetchAsTestUser1('/orders');
          })
          .then((resp) => {
            expect(resp.status).toBe(200);
            return resp.json();
          })
      ))
      .then((orders) => {
        expect(Array.isArray(orders)).toBe(true);
        expect(orders.length > 0);
        const userIds = orders.reduce((memo, order) => (
          (memo.indexOf(order.userId) === -1)
            ? [...memo, order.userId]
            : memo
        ), []);
        expect(userIds.length >= 1).toBe(true);
      })
  ));

  it('should get orders as admin', () => (
    Promise.all([
      fetchAsAdmin('/products', {
        method: 'POST',
        body: { name: 'Test3', price: 10 },
      }),
      fetchAsAdmin('/users/test@test.test'),
    ])
      .then((responses) => {
        expect(responses[0].status).toBe(200);
        expect(responses[1].status).toBe(200);
        return Promise.all([responses[0].json(), responses[1].json()]);
      })
      .then(([product, user]) => (
        Promise.all([
          fetchAsTestUser1('/orders', {
            method: 'POST',
            body: { products: [{ product: product, qty: 50 }], client: 'Client5', userId: user._id },
          }),
          fetchAsAdmin('/orders', {
            method: 'POST',
            body: { products: [{ product: product, qty: 25 }], client: 'Client6', userId: user._id },
          }),
        ])
          .then((responses) => {
            expect(responses[0].status).toBe(200);
            expect(responses[1].status).toBe(200);
            return fetchAsAdmin('/orders');
          })
          .then((resp) => {
            expect(resp.status).toBe(200);
            return resp.json();
          })
      ))
      .then((orders) => {
        expect(Array.isArray(orders)).toBe(true);
        expect(orders.length > 0);
        const userIds = orders.reduce((memo, order) => (
          (memo.indexOf(order.userId) === -1)
            ? [...memo, order.userId]
            : memo
        ), []);
        expect(userIds.length >= 1).toBe(true);
      })
  ));
});

describe('GET /orders/:orderId', () => {
  it('should fail with 401 when no auth', () => (
    fetch('/orders/xxx')
      .then((resp) => expect(resp.status).toBe(401))
  ));

  it('should fail with 404 when admin and not found', () => (
    fetchAsAdmin('/orders/xxx')
      .then((resp) => expect(resp.status).toBe(404))
  ));

  it('should get order as user', () => (
    Promise.all([
      fetchAsAdmin('/products', {
        method: 'POST',
        body: { name: 'Test4', price: 99 },
      }),
      fetchAsAdmin('/users/test@test.test'),
    ])
      .then((responses) => {
        expect(responses[0].status).toBe(200);
        expect(responses[1].status).toBe(200);
        return Promise.all([responses[0].json(), responses[1].json()]);
      })
      .then(([product, user]) => fetchAsTestUser1('/orders', {
        method: 'POST',
        body: { products: [{ product: product, qty: 5 }], client: 'Client6', userId: user._id },
      }))
      .then((resp) => {
        expect(resp.status).toBe(200);
        return resp.json();
      })
      .then((json) => fetchAsTestUser1(`/orders/${json._id}`))
      .then((resp) => {
        expect(resp.status).toBe(200);
        return resp.json();
      })
      .then((json) => {
        expect(json.products.length).toBe(1);
        expect(json.products[0].product.name).toBe('Test4');
        expect(json.products[0].product.price).toBe(99);
      })
  ));

  it('should get order as admin', () => (
    Promise.all([
      fetchAsAdmin('/products', {
        method: 'POST',
        body: { name: 'Test7', price: 10 },
      }),
      fetchAsAdmin('/users/test@test.test'),
    ])
      .then((responses) => {
        expect(responses[0].status).toBe(200);
        expect(responses[1].status).toBe(200);
        return Promise.all([responses[0].json(), responses[1].json()]);
      })
      .then(([product, user]) => fetchAsTestUser1('/orders', {
        method: 'POST',
        body: { products: [{ product: product, qty: 5 }], client: 'Client7', userId: user._id },
      }))
      .then((resp) => {
        expect(resp.status).toBe(200);
        return resp.json();
      })
      .then((json) => fetchAsAdmin(`/orders/${json._id}`))
      .then((resp) => {
        expect(resp.status).toBe(200);
        return resp.json();
      })
      .then((json) => {
        expect(json.products.length).toBe(1);
        expect(json.products[0].product.name).toBe('Test7');
        expect(json.products[0].product.price).toBe(10);
      })
  ));
});

describe('PUT /orders/:orderId', () => {
  it('should fail with 401 when no auth', () => (
    fetch('/orders/xxx', { method: 'PUT' })
      .then((resp) => expect(resp.status).toBe(401))
  ));

  it('should fail with 404 when not found', () => (
    fetchAsAdmin('/orders/xxx', {
      method: 'PUT',
      body: { state: 'canceled' },
    })
      .then((resp) => expect(resp.status).toBe(404))
  ));

  it('should fail with 400 when bad props', () => (
    Promise.all([
      fetchAsAdmin('/products', {
        method: 'POST',
        body: { name: 'Test8', price: 66 },
      }),
      fetchAsAdmin('/users/test@test.test'),
    ])
      .then((responses) => {
        expect(responses[0].status).toBe(200);
        expect(responses[1].status).toBe(200);
        return Promise.all([responses[0].json(), responses[1].json()]);
      })
      .then(([product, user]) => fetchAsTestUser1('/orders', {
        method: 'POST',
        body: { products: [{ product: product, qty: 5 }], client: 'Client8', userId: user._id },
      }))
      .then((resp) => {
        expect(resp.status).toBe(200);
        return resp.json();
      })
      .then((json) => fetchAsTestUser1(`/orders/${json._id}`))
      .then((resp) => resp.json())
      .then((json) => fetchAsAdmin(`/orders/${json._id}`, { method: 'PUT' }))
      .then((resp) => expect(resp.status).toBe(400))
  ));

  it('should fail with 400 when bad status', () => (
    Promise.all([
      fetchAsAdmin('/products', {
        method: 'POST',
        body: { name: 'Test9', price: 66 },
      }),
      fetchAsAdmin('/users/test@test.test'),
    ])
      .then((responses) => {
        expect(responses[0].status).toBe(200);
        expect(responses[1].status).toBe(200);
        return Promise.all([responses[0].json(), responses[1].json()]);
      })
      .then(([product, user]) => fetchAsTestUser1('/orders', {
        method: 'POST',
        body: { products: [{ product: product, qty: 5 }], client: 'Client9', userId: user._id },
      }))
      .then((resp) => {
        expect(resp.status).toBe(200);
        return resp.json();
      })
      .then((json) => fetchAsAdmin(`/orders/${json._id}`, {
        method: 'PUT',
        body: { status: 'oh yeah!' },
      }))
      .then((resp) => expect(resp.status).toBe(400))
  ));

  it('should update order (set status to preparing)', () => (
    Promise.all([
      fetchAsAdmin('/products', {
        method: 'POST',
        body: { name: 'Test10', price: 66 },
      }),
      fetchAsAdmin('/users/test@test.test'),
    ])
      .then((responses) => {
        expect(responses[0].status).toBe(200);
        expect(responses[1].status).toBe(200);
        return Promise.all([responses[0].json(), responses[1].json()]);
      })
      .then(([product, user]) => fetchAsTestUser1('/orders', {
        method: 'POST',
        body: { products: [{ product: product, qty: 5 }], client: 'Client10', userId: user._id },
      }))
      .then((resp) => {
        expect(resp.status).toBe(200);
        return resp.json();
      })
      .then((json) => {
        expect(json.status).toBe('pending');
        return fetchAsAdmin(`/orders/${json._id}`, {
          method: 'PUT',
          body: { status: 'preparing' },
        });
      })
      .then((resp) => {
        expect(resp.status).toBe(200);
        return resp.json();
      })
      .then((json) => expect(json.status).toBe('preparing'))
  ));

  it('should update order (set status to delivering)', () => (
    Promise.all([
      fetchAsAdmin('/products', {
        method: 'POST',
        body: { name: 'Test11', price: 66 },
      }),
      fetchAsAdmin('/users/test@test.test'),
    ])
      .then((responses) => {
        expect(responses[0].status).toBe(200);
        expect(responses[1].status).toBe(200);
        return Promise.all([responses[0].json(), responses[1].json()]);
      })
      .then(([product, user]) => fetchAsTestUser1('/orders', {
        method: 'POST',
        body: { products: [{ product: product, qty: 5 }], client: 'Client11', userId: user._id },
      }))
      .then((resp) => {
        expect(resp.status).toBe(200);
        return resp.json();
      })
      .then((json) => {
        expect(json.status).toBe('pending');
        return fetchAsAdmin(`/orders/${json._id}`, {
          method: 'PUT',
          body: { status: 'delivering' },
        });
      })
      .then((resp) => {
        expect(resp.status).toBe(200);
        return resp.json();
      })
      .then((json) => expect(json.status).toBe('delivering'))
  ));

  it('should update order (set status to delivered)', () => (
    Promise.all([
      fetchAsAdmin('/products', {
        method: 'POST',
        body: { name: 'Test12', price: 66 },
      }),
      fetchAsAdmin('/users/test@test.test'),
    ])
      .then((responses) => {
        expect(responses[0].status).toBe(200);
        expect(responses[1].status).toBe(200);
        return Promise.all([responses[0].json(), responses[1].json()]);
      })
      .then(([product, user]) => fetchAsTestUser1('/orders', {
        method: 'POST',
        body: { products: [{ product: product, qty: 5 }], client: 'Client12', userId: user._id },
      }))
      .then((resp) => {
        expect(resp.status).toBe(200);
        return resp.json();
      })
      .then((json) => {
        expect(json.status).toBe('pending');
        return fetchAsAdmin(`/orders/${json._id}`, {
          method: 'PUT',
          body: { status: 'delivered' },
        });
      })
      .then((resp) => {
        expect(resp.status).toBe(200);
        return resp.json();
      })
      .then((json) => {
        expect(json.status).toBe('delivered');
        expect(typeof json.dateProcessed).toBe('string');
      })
  ));
});

describe('DELETE /orders/:orderId', () => {
  it('should fail with 401 when no auth', () => (
    fetch('/orders/xxx', { method: 'DELETE' })
      .then((resp) => expect(resp.status).toBe(401))
  ));

  it('should fail with 404 when not found', () => (
    fetchAsAdmin('/orders/xxx', { method: 'DELETE' })
      .then((resp) => expect(resp.status).toBe(404))
  ));

  it('should delete other order as admin', () => (
    Promise.all([
      fetchAsAdmin('/products', {
        method: 'POST',
        body: { name: 'Test13', price: 25 },
      }),
      fetchAsAdmin('/users/test@test.test'),
    ])
      .then((responses) => {
        expect(responses[0].status).toBe(200);
        expect(responses[1].status).toBe(200);
        return Promise.all([responses[0].json(), responses[1].json()]);
      })
      .then(([product, user]) => fetchAsTestUser1('/orders', {
        method: 'POST',
        body: { products: [{ product: product, qty: 5 }], client: 'Client13', userId: user._id },
      }))
      .then((resp) => {
        expect(resp.status).toBe(200);
        return resp.json();
      })
      .then(
        ({ _id }) => fetchAsAdmin(`/orders/${_id}`, { method: 'DELETE' })
          .then((resp) => ({ resp, _id })),
      )
      .then(({ resp, _id }) => {
        expect(resp.status).toBe(200);
        return fetchAsAdmin(`/orders/${_id}`);
      })
      .then((resp) => expect(resp.status).toBe(404))
  ));
});
