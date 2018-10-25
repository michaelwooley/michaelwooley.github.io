import numpy as np


class TsData(object):
  def __init__(
    self,
    n: int,
    p: int,
    B_target: [None, np.ndarray] = None,
    stoch: bool = True
  ):

    self.n = n
    self.p = p
    self.B_target = B_target
    self.stoch = stoch

    self.F = self.build_coeff() if B_target is None else self.build_target_coeff()
    self.C = self.build_constant()
    self.B = np.vstack([self.C] + np.split(self.F[:n, :], p, axis=1))

    self.cov_chol = self.build_cov()
    self.x0 = self.build_x0()

  def build_cov(self):

    n = self.n
    sigma = np.random.randn(n, n)
    sigma = sigma.T.dot(sigma)
    return np.linalg.cholesky(sigma)

  def build_coeff(self):
    n, p = self.n, self.p

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

    return F

  def build_constant(self):
    return np.random.randn(self.n)

  def build_target_coeff(self, B_target: np.ndarray) -> np.ndarray:
    raise NotImplementedError

  def sample_data(
    self,
    T: int = 250,
    x0: [np.ndarray, None] = None,
    stoch: [None, bool] = None,
    burnin: int = 0
  ) -> np.ndarray:

    n, p, B = self.n, self.p, self.B

    stoch = stoch if stoch is not None else self.stoch
    Tb = T + burnin

    xx = x0 if x0 is not None else self.x0
    eps = stoch * self.cov_chol.dot(np.random.randn(n, Tb)).T

    d = -99.0 * np.ones((Tb, n))
    for hh in range(Tb):
      yy = xx.dot(B) + eps[hh]

      d[hh] = yy

      xx = np.roll(xx, n)
      xx[1:(n + 1)] = yy
      xx[0] = 1.0

    return d[burnin:]

  def build_x0(self):

    return np.hstack([[1.0], np.random.randn(self.n * self.p)])