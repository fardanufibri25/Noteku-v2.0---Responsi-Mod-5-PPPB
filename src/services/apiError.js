const byStatus = {
  400: 'Permintaan tidak valid. Periksa kembali data catatan.',
  401: 'Sesi berakhir. Silakan masuk kembali.',
  403: 'Akses ditolak untuk akun ini.',
  404: 'Catatan tidak ditemukan di server.',
  409: 'Catatan berubah di perangkat lain. Sinkronisasi dijeda agar perubahan lokal tidak hilang.',
}

export function messageOf(error, fallback) {
  const status = error?.response?.status
  if (status >= 500) return 'Server catatan sedang bermasalah. Perubahan menunggu sinkronisasi.'
  if (error?.code === 'ERR_NETWORK' || (error?.request && !error?.response)) {
    return 'Tidak dapat terhubung ke server. Perubahan tersimpan lokal.'
  }
  return byStatus[status]
    || error?.response?.data?.message
    || error?.response?.data?.error
    || error?.message
    || fallback
}
