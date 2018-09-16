import pytest
import numpy as np
import numpy.testing as npt
import scipy.stats as stats

from . import chol_kron_ab as cke


def test_chol():

  for ii in range(100):
    n = np.random.choice(range(2, 300))
    A = stats.wishart.rvs(df=n + 2, scale=np.random.randn(n)**2.)

    L_o = cke.chol(A)
    L_f = np.linalg.cholesky(A)

    npt.assert_array_almost_equal(L_o, L_f)


def test_chol_kron_e():

  for _ in range(100):
    n0, n1 = np.random.choice(range(2, 30), size=2)

    A = stats.wishart.rvs(df=n0 + 2, scale=np.random.randn(n0)**2.)
    B = stats.wishart.rvs(df=n1 + 2, scale=np.random.randn(n1)**2.)
    e = np.random.randn(n0 * n1)

    ck_o = cke.chol_kron_e_loop(A, B, e)
    ck_f = np.linalg.cholesky(np.kron(A, B)).dot(e)

    print(ck_o)
    print()
    print(ck_f)

    npt.assert_array_almost_equal(ck_o, ck_f)


def test_chol_kron_e_numpy():

  for _ in range(100):
    n0, n1 = np.random.choice(range(2, 30), size=2)

    A = stats.wishart.rvs(df=n0 + 2, scale=np.random.randn(n0)**2.)
    B = stats.wishart.rvs(df=n1 + 2, scale=np.random.randn(n1)**2.)
    e = np.random.randn(n0 * n1)

    ck_o = cke.chol_kron_e_numpy(A, B, e)
    ck_f = np.linalg.cholesky(np.kron(A, B)).dot(e)

    npt.assert_array_almost_equal(ck_o, ck_f)