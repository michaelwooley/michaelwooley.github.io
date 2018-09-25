import numba
import numpy as np

FTYPE = numba.float64
ITYPE = numba.int64
FTYPE_ = np.float64
ITYPE_ = np.int64
FVECTOR = numba.float64[:]
FMATRIX = numba.float64[:, :]


@numba.njit(FMATRIX(FMATRIX, FMATRIX), cache=True)
def kron(A: FMATRIX, B: FMATRIX) -> FMATRIX:
  """Kronecker product of two matrices A and B
  Note: This appears to be faster than the NumPy implementation, which is based on reshapes. Assigning each element individually also tends to be faster than assigning by blocks a la:
      out[ii * shpB[0]:(ii + 1) * shpB[0], jj * shpB[1]:(jj + 1) * shpB[1]
          ] = A[ii, jj] * B
  Args:
      A (FMATRIX): Matrix
      B (FMATRIX): Matrix
  Returns:
      FMATRIX: kron(A,B)
  """
  shpA = A.shape
  shpB = B.shape
  out = np.empty((shpA[0] * shpB[0], shpA[1] * shpB[1]))

  for ii in range(shpA[0]):
    for jj in range(shpA[1]):
      for kk in range(shpB[0]):
        for hh in range(shpB[1]):
          out[ii * shpB[0] + kk, jj * shpB[1] + hh] = A[ii, jj] * B[kk, hh]

  return out


@numba.njit(FMATRIX(FMATRIX), cache=True)
def chol(A: FMATRIX) -> FMATRIX:
  """Cholesky decomposition of Real, Symmetric, Positive Definite Matrix A
  Args:
      A (FMATRIX): Real, Symmetric, Positive Definite Matrix
  Returns:
      FMATRIX: Lower Triangular Matrix `L` s.t. `A = L * L'`
  """
  m, _ = A.shape
  L = np.zeros((m, m))

  for ii in range(0, m):
    for kk in range(0, ii + 1):
      L[ii, kk] = A[ii, kk]
      for jj in range(0, kk):
        L[ii, kk] -= (L[ii, jj] * L[kk, jj])

      if ii == kk:
        L[ii, kk] **= 0.5
      else:
        L[ii, kk] /= L[kk, kk]

  return L


@numba.njit(FMATRIX(FMATRIX), cache=True)
def np_chol(A: FMATRIX) -> FMATRIX:
  return np.linalg.cholesky(A)


@numba.jit(FMATRIX(FMATRIX, FMATRIX), cache=True)
def np_kron(A: FMATRIX, B: FMATRIX) -> FMATRIX:
  return np.kron(A, B)


@numba.njit(FVECTOR(FMATRIX, FMATRIX, FVECTOR), cache=True)
def chol_kron_e_loop(A: FMATRIX, B: FMATRIX, e: FVECTOR) -> FVECTOR:
  """Solution to `cholesky[kron[A, B]] * e`.
  Args:
      A (FMATRIX): Real, Symmetric, Positive Definite Matrix of size [mA, , mA]
      B (FMATRIX): Real, Symmetric, Positive Definite Matrix of size [mB, mB]
      e (FVECTOR): Vector of shape [mA * mB, 1]
  Returns:
      FVECTOR: Vector of shape [mA * mB, 1] solution to `cholesky[kron[A, B]] * e`
  """
  mA = A.shape[0]
  mB = B.shape[0]
  L_a = np.linalg.cholesky(A)
  L_b = np.linalg.cholesky(B)

  out = np.zeros((mA * mB))

  for ii in range(mA):
    for jj in range(ii + 1):
      for hh in range(mB):
        for kk in range(hh + 1):
          out[mB * ii + hh] += L_a[ii, jj] * L_b[hh, kk] * e[mB * jj + kk]

  return out


@numba.njit(FVECTOR(FMATRIX, FMATRIX, FVECTOR), cache=True)
def chol_kron_e_numpy(A: FMATRIX, B: FMATRIX, e: FVECTOR) -> FVECTOR:
  """Solution to `cholesky[kron[A, B]] * e`.
  Computes using NumPy functions. For testing purposes only.
  Args:
      A (FMATRIX): Real, Symmetric, Positive Definite Matrix of size [mA, , mA]
      B (FMATRIX): Real, Symmetric, Positive Definite Matrix of size [mB, mB]
      e (FVECTOR): Vector of shape [mA * mB, 1]
  Returns:
      FVECTOR: Vector of shape [mA * mB, 1] solution to `cholesky[kron[A, B]] * e`
  """
  out = np.linalg.cholesky(kron(A, B))
  return np.dot(out, e)