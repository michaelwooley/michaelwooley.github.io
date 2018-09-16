import numpy as np
import pandas as pd
import scipy.stats as stats
import numpy.testing as npt
import matplotlib.pyplot as plt
import seaborn as sns

from memory_profiler import memory_usage
import timeit

sns.set_style('whitegrid')
sns.set_palette('deep')

import chol_kron_ab as cke


def kron_growth():
  """Growth in Size of Kronecker
  """
  dfl, n_bds = [], [2, 200]
  for n in range(*n_bds):
    for p in [3, 6, 13]:
      sz = (n * (n * p + 1))**2.
      dfl.append({'n': n, 'Lags': p, 'Size': sz, 'Mb': sz * 8 * 1e-9})
  df_sz = pd.DataFrame(dfl)
  fig, axes = plt.subplots(
    1, 2, sharex=True, sharey=False, figsize=(10, 5)
  )

  df_sz.pivot(
    index='n', columns='Lags', values='Size'
  ).plot(
    ax=axes[0], logy=True
  )
  df_sz.pivot(
    index='n', columns='Lags', values='Mb'
  ).plot(
    ax=axes[1], legend=False, logy=True
  )

  axes[0].set_xlabel('Number of variables (n)')
  axes[1].set_xlabel('Number of variables (n)')

  axes[0].set_title('Size of $A \\otimes B$: Elements')
  axes[1].set_title('Size of $A \\otimes B$: Gigabytes')

  fig.savefig('../media/chol_kron_ab_size.svg')

  return None


def time_comparison():
  dfl, n_bds, iters = [], [2, 25], 10
  for n in range(*n_bds):
    print('{}'.format(n), end=', ')
    for p in [3, 6, 13]:

      k = n * p + 1

      A = stats.wishart.rvs(
        df=n + 2, scale=np.diag(np.random.randn(n)**2.)
      )
      B = stats.wishart.rvs(
        df=k + 2, scale=np.diag(np.random.randn(k)**2.)
      )
      e = np.random.randn(k * n)

      time_np = timeit.timeit(
        'chol_kron_e_numpy(A, B, e)',
        globals={
          'chol_kron_e_numpy': cke.chol_kron_e_numpy,
          'A': A,
          'B': B,
          'e': e
        },
        number=iters
      )
      time_loop = timeit.timeit(
        'chol_kron_e_loop(A, B, e)',
        globals={
          'chol_kron_e_loop': cke.chol_kron_e_loop,
          'A': A,
          'B': B,
          'e': e
        },
        number=iters
      )
      # time_loop =  %timeit -o -q -n 1 -r 1 cke.chol_kron_e_loop(A, B, e)

      dfl.append(
        {
          'n': n,
          'Lags': p,
          'k': k,
          'runtime_numpy': time_np,
          'runtime_loop': time_loop
        }
      )
  df = pd.DataFrame(dfl)
  df['runtime_relative'
     ] = 100 * np.log(df['runtime_numpy'] / df['runtime_loop'])
  n_bds = [2, 25]
  fig, axes = plt.subplots(
    1, 2, sharex=True, sharey=False, figsize=(10, 5)
  )

  ax0 = axes[0]
  df.pivot(
    index='n', columns='Lags', values='runtime_relative'
  ).plot(ax=ax0)
  ax0.set_title('Relative Runtime: Loop/NumPy')
  ax0.set_ylabel('log(Loop / NumPy) (%)')
  ax0.set_xlabel('Number of variables (n)')
  ax0.set_xticks(range(*n_bds))

  ax1 = axes[1]
  df.pivot(
    index='n', columns='Lags', values='runtime_loop'
  ).plot(
    ax=ax1, legend=False
  )
  ax1.set_title('Runtime: Loop')
  ax1.set_ylabel('Seconds')
  ax1.set_xlabel('Number of variables (n)')
  ax1.set_xticks(range(*n_bds))
  fig.savefig('../media/chol_kron_time_usage.svg')
  return None


def memory_comparison():
  dfl, n_bds = [], [2, 50, 10]
  for n in range(*n_bds):
    print('{}'.format(n), end=', ')
    for p in [13]:
      k = n * p + 1

      A = stats.wishart.rvs(
        df=n + 2, scale=np.diag(np.random.randn(n)**2.)
      )
      B = stats.wishart.rvs(
        df=k + 2, scale=np.diag(np.random.randn(k)**2.)
      )
      e = np.random.randn(k * n)

      # mem_np = %memit -o -q -r 1 cke.chol_kron_e_numpy(A, B, e)
      # mem_loop =  %memit -o -q -r 1 cke.chol_kron_e_loop(A, B, e)
      mem_np = memory_usage(
        (cke.chol_kron_e_numpy, (A, B, e)), interval=.1
      )
      mem_loop = memory_usage(
        (cke.chol_kron_e_loop, (A, B, e)), interval=.1
      )

      dfl.append(
        {
          'n': n,
          'Lags': p,
          'k': k,
          'mem_numpy': np.max(mem_np),
          'mem_loop': np.max(mem_loop)
        }
      )
  df_mem = pd.DataFrame(dfl)
  df_mem['mem_relative'
         ] = 100 * np.log(df_mem['mem_numpy'] / df_mem['mem_loop'])

  n_bds = [2, 50, 10]
  fig_mem, axes = plt.subplots(
    1, 2, sharex=True, sharey=False, figsize=(10, 5)
  )

  ax0 = axes[0]
  df_mem.pivot(
    index='n', columns='Lags', values='mem_relative'
  ).plot(
    marker='o', ax=ax0
  )
  ax0.set_title('Relative Memory Usage')
  ax0.set_ylabel('100 * log(Loop / NumPy) (%)')
  ax0.set_xlabel('Number of variables (n)')
  ax0.set_xticks(range(*n_bds))

  ax1 = axes[1]
  df_mem.pivot(
    index='n', columns='Lags', values='mem_loop'
  ).plot(
    marker='o', ax=ax1, legend=False
  )
  ax1.set_title('Max. Memory Usage: Loop')
  ax1.set_ylabel('Megabytes')
  ax1.set_xlabel('Number of variables (n)')
  ax1.set_xticks(range(*n_bds))
  fig_mem.savefig('../media/chol_kron_memory_usage.svg')
  return None


def large_matrices():
  dfl, n_bds, iters = [], [25, 203, 5], 10
  for n in range(*n_bds):
    print('{}'.format(n), end=', ')
    for p in [13]:  #[3, 6, 13]:

      k = n * p + 1

      A = stats.wishart.rvs(
        df=n + 2, scale=np.diag(np.random.randn(n)**2.)
      )
      B = stats.wishart.rvs(
        df=k + 2, scale=np.diag(np.random.randn(k)**2.)
      )
      e = np.random.randn(k * n)

      # time_loop =  %timeit -o -q -r 1 cke.chol_kron_e_loop(A, B, e)
      time_loop = timeit.timeit(
        'chol_kron_e_loop(A, B, e)',
        globals={
          'chol_kron_e_loop': cke.chol_kron_e_loop,
          'A': A,
          'B': B,
          'e': e
        },
        number=iters
      )
      mem_loop = memory_usage(
        (cke.chol_kron_e_loop, (A, B, e)), interval=0.1
      )

      dfl.append(
        {
          'n': n,
          'Lags': p,
          'k': k,
          'runtime': time_loop,
          'mem_loop': np.max(mem_loop)
        }
      )

  df_big = pd.DataFrame(dfl)
  fig_mem, axes = plt.subplots(
    1, 2, sharex=True, sharey=False, figsize=(10, 5)
  )

  ax0 = axes[0]
  df_big.pivot(
    index='n', columns='Lags', values='runtime'
  ).plot(
    marker='o', ax=ax0
  )
  ax0.set_title('Runtime')
  ax0.set_ylabel('Seconds')
  ax0.set_xlabel('Number of variables (n)')
  ax0.set_xticks(range(*n_bds))

  ax1 = axes[1]
  df_big.pivot(
    index='n', columns='Lags', values='mem_loop'
  ).plot(
    marker='o', ax=ax1, legend=False
  )
  ax1.set_title('Max. Memory Usage')
  ax1.set_ylabel('Megabytes')
  ax1.set_xlabel('Number of variables (n)')
  ax1.set_xticks(range(*n_bds))
  fig_mem.savefig('../media/chol_kron_big.svg')
  return None


if __name__ == "__main__":
  import time
  print('BENCHMARKS')

  # print('Size of Matrices from Kronecker Products:')
  # tic = time.time()
  # kron_growth()
  # print('\t{:6.2f} s.'.format(time.time() - tic))

  # print('Time Comparison: ')
  # tic = time.time()
  # time_comparison()
  # print('{}'.format(time.time() - tic))

  print('Memory Comparison: ')
  tic = time.time()
  memory_comparison()
  print('\t{:6.2f} s.'.format(time.time() - tic))

  print('Large Matrix Benchmarks: ')
  tic = time.time()
  large_matrices()
  print('\t{:6.2f} s.'.format(time.time() - tic))
