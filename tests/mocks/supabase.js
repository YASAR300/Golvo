import { vi } from "vitest";

/**
 * Creates a flexible, chainable Supabase client mock.
 * Supports promise resolution on any terminal method or via then().
 */
export function createMockQueryBuilder(resolvedData = null, resolvedError = null) {
  const result = { data: resolvedData, error: resolvedError, count: Array.isArray(resolvedData) ? resolvedData.length : 0 };

  const builder = {
    _data: resolvedData,
    _error: resolvedError,

    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),

    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),

    single: vi.fn().mockImplementation(async () => {
      const data = Array.isArray(builder._data) ? builder._data[0] || null : builder._data;
      return { data, error: builder._error };
    }),

    maybeSingle: vi.fn().mockImplementation(async () => {
      const data = Array.isArray(builder._data) ? builder._data[0] || null : builder._data;
      return { data, error: builder._error };
    }),

    // Make the query builder awaitable directly
    then(onFulfilled, onRejected) {
      return Promise.resolve(result).then(onFulfilled, onRejected);
    },
    catch(onRejected) {
      return Promise.resolve(result).catch(onRejected);
    },
  };

  return builder;
}

export function createMockSupabaseClient({
  tableData = {},
  auth = {},
  storage = {},
} = {}) {
  const mockFrom = vi.fn((table) => {
    const data = tableData[table] !== undefined ? tableData[table] : null;
    return createMockQueryBuilder(data);
  });

  const mockAuth = {
    getUser: vi.fn().mockResolvedValue({
      data: {
        user: auth.user || null,
      },
      error: auth.userError || null,
    }),
    getSession: vi.fn().mockResolvedValue({
      data: {
        session: auth.session || (auth.user ? { user: auth.user } : null),
      },
      error: auth.sessionError || null,
    }),
    signInWithPassword: vi.fn().mockResolvedValue({
      data: { user: auth.user || null, session: auth.session || null },
      error: null,
    }),
    signUp: vi.fn().mockResolvedValue({
      data: { user: auth.user || null, session: auth.session || null },
      error: null,
    }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    resetPasswordForEmail: vi.fn().mockResolvedValue({ error: null }),
    updateUser: vi.fn().mockResolvedValue({ data: { user: auth.user }, error: null }),
    admin: {
      updateUserById: vi.fn().mockResolvedValue({ data: { user: auth.user }, error: null }),
    },
    ...auth,
  };

  const mockStorage = {
    from: vi.fn((_bucket) => ({
      upload: vi.fn().mockResolvedValue({ data: { path: "proofs/test.png" }, error: null }),
      getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: "https://test.supabase.co/proofs/test.png" } }),
    })),
    ...storage,
  };

  return {
    from: mockFrom,
    auth: mockAuth,
    storage: mockStorage,
  };
}
