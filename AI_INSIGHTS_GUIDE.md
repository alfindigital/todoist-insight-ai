# Panduan AI Insights dengan Google Gemini

## Pendahuluan

Fitur AI Insights baru ini menggunakan Google Gemini untuk menganalisis data tugas Todoist Anda dan memberikan wawasan yang bermanfaat serta rekomendasi yang actionable dalam bahasa Indonesia.

## Fitur AI Insights

### 🔍 Analisis Cerdas
- Analisis pola produktivitas berdasarkan data tugas Anda
- Identifikasi area yang perlu diperbaiki
- Evaluasi tren completion rate dan performa

### 💡 Rekomendasi Personal
- Saran praktis untuk meningkatkan produktivitas
- Tips manajemen waktu yang dipersonalisasi
- Strategi fokus dan organisasi yang relevan

### 🔮 Prediksi Berdasarkan Data
- Prediksi pola kerja masa depan
- Antisipasi periode sibuk atau produktif
- Analisis tren jangka panjang

## Pengaturan Awal

### 1. Dapatkan API Key Gemini

1. Kunjungi [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Login dengan akun Google Anda
3. Klik "Create API Key"
4. Salin API key yang dihasilkan

### 2. Konfigurasi Environment Variables

Tambahkan API key ke file `.env.local` Anda:

```env
GEMINI_API_KEY=your-gemini-api-key-here
```

### 3. Restart Aplikasi

Setelah menambahkan API key, restart server development:

```bash
npm run dev
```

## Cara Menggunakan

### Mengakses AI Insights

1. Login ke dashboard Todoist Anda
2. AI Insights akan muncul di bagian atas dashboard
3. Sistem akan otomatis menganalisis data saat halaman dimuat
4. Klik "Refresh AI" untuk mendapatkan analisis terbaru

### Memahami Output AI

#### 📊 Insights
- **Prioritas Tinggi**: Area yang memerlukan perhatian segera
- **Prioritas Sedang**: Perbaikan yang bisa dilakukan bertahap
- **Prioritas Rendah**: Optimisasi opsional

#### 💡 Rekomendasi
- **Manajemen Waktu**: Tips untuk mengatur waktu lebih efektif
- **Fokus**: Cara meningkatkan konsentrasi
- **Organisasi**: Strategi mengatur tugas dan proyek
- **Motivasi**: Tips mempertahankan semangat kerja

#### 🔮 Prediksi
- **Tingkat Kepercayaan Tinggi**: Prediksi berdasarkan pola yang konsisten
- **Tingkat Kepercayaan Sedang**: Prediksi dengan beberapa variasi data
- **Tingkat Kepercayaan Rendah**: Prediksi memerlukan data lebih banyak

## Tips Penggunaan

### Untuk Hasil AI Terbaik

1. **Gunakan Todoist Secara Konsisten**
   - Input semua tugas ke Todoist
   - Tandai tugas selesai secara real-time
   - Gunakan project dan label secara konsisten

2. **Berikan Data yang Cukup**
   - Minimal 2 minggu data untuk insights basic
   - 1 bulan+ untuk prediksi yang akurat
   - 3 bulan+ untuk analisis trend mendalam

3. **Update Secara Berkala**
   - Klik "Refresh AI" setelah menyelesaikan banyak tugas
   - Review insights mingguan untuk tracking progress
   - Gunakan rekomendasi untuk improve workflow

### Troubleshooting

#### AI Insights Tidak Muncul
1. Pastikan `GEMINI_API_KEY` sudah diset dengan benar
2. Check console browser untuk error messages
3. Pastikan koneksi internet stabil
4. Restart aplikasi setelah update environment variables

#### Insights Kurang Akurat
1. Pastikan data Todoist Anda lengkap dan up-to-date
2. Gunakan aplikasi minimal 2 minggu secara konsisten
3. Input tugas dengan deskripsi yang jelas
4. Kategorisasi project dengan baik

#### Error "Failed to generate insights"
1. Check API quota Gemini Anda
2. Pastikan API key masih valid
3. Check apakah service Gemini sedang down
4. Coba lagi setelah beberapa menit

## Privasi dan Keamanan

### Data Yang Dikirim ke Gemini
- Jumlah tugas aktif dan selesai
- Nama project (tanpa detail sensitif)
- Pola completion rate
- Statistik produktivitas umum
- **TIDAK TERMASUK**: Isi detail tugas, informasi personal, atau data sensitif

### Keamanan
- API key disimpan lokal di server Anda
- Tidak ada data yang disimpan di server external
- Komunikasi dengan Gemini menggunakan HTTPS
- Data analysis hanya berdasarkan pattern, bukan content

## FAQ

**Q: Apakah gratis menggunakan Gemini AI?**
A: Google Gemini memiliki free tier yang cukup untuk penggunaan personal. Check [pricing](https://ai.google.dev/pricing) untuk detail.

**Q: Bisakah AI memberikan rekomendasi untuk team?**
A: Saat ini AI focus pada insights personal. Fitur team analysis mungkin ditambahkan di update mendatang.

**Q: Seberapa sering saya harus refresh AI insights?**
A: Disarankan weekly atau setelah menyelesaikan project besar untuk insights terbaru.

**Q: AI tidak memahami konteks kerja saya, bagaimana?**
A: AI akan belajar dari pola penggunaan Anda. Semakin konsisten menggunakan Todoist, semakin akurat insights-nya.

**Q: Bisakah mengubah bahasa insights ke English?**
A: Saat ini hanya support Bahasa Indonesia. Multi-language support sedang dalam pengembangan.

## Kontribusi dan Feedback

Jika Anda menemukan bug atau punya saran untuk fitur AI Insights:

1. Buat issue di GitHub repository
2. Sertakan detail error message dan steps to reproduce
3. Berikan feedback tentang kualitas insights yang dihasilkan

## Update Mendatang

Fitur yang sedang dikembangkan:
- Multi-language support
- Team insights analysis
- Integration dengan calendar apps
- Custom AI prompts
- Historical insights comparison
- Export insights to PDF

---

**Selamat menggunakan AI Insights! Semoga membantu meningkatkan produktivitas Anda! 🚀**