import numpy as np

n, p = 4, 3

v = np.random.uniform(-1, 1, size=n * p)
w = np.random.randn(n * p, n)

W = []
for ii in range(n * p):
  lv = np.array([v[ii]**jj for jj in range(p - 1, -1, -1)])
  W.append(np.kron(lv, w[ii, :]).reshape((n * p, 1)))

W = np.hstack(W)
V = np.diag(v)

# Create the Matrix
F = W.dot(V).dot(np.linalg.inv(W))
# Polish off
F[np.abs(F) < 1e-10] = 0