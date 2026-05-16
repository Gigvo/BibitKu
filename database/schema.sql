-- ============================================================
-- Database: GreenSeed Marketplace – Bibit Tanaman (Multi-Company)
-- ============================================================

DROP DATABASE IF EXISTS bibit_tanaman_db;

CREATE DATABASE bibit_tanaman_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE bibit_tanaman_db;

-- ------------------------------------------------------------
-- Table: users
-- Role:
--   'user'   → pembeli biasa
--   'seller' → pemilik toko / penjual
--   'admin'  → super-admin marketplace
-- ------------------------------------------------------------
CREATE TABLE users (
  id         INT          NOT NULL AUTO_INCREMENT,
  nama       VARCHAR(100) NOT NULL,
  email      VARCHAR(100) NOT NULL UNIQUE,
  password   VARCHAR(255) NOT NULL,
  role       ENUM('user','seller','admin') NOT NULL DEFAULT 'user',
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Table: toko
-- Setiap seller memiliki tepat satu profil toko.
-- Status:
--   'pending'   → menunggu approval admin
--   'active'    → toko aktif dan bisa berjualan
--   'suspended' → toko dinonaktifkan oleh admin
-- ------------------------------------------------------------
CREATE TABLE toko (
  id          INT          NOT NULL AUTO_INCREMENT,
  user_id     INT          NOT NULL UNIQUE,
  nama_toko   VARCHAR(100) NOT NULL,
  deskripsi   TEXT,
  logo        VARCHAR(255) DEFAULT NULL,
  alamat      VARCHAR(255) DEFAULT NULL,
  status      ENUM('pending','active','suspended') NOT NULL DEFAULT 'pending',
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_toko_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Table: bibit_tanaman
-- Setiap produk dimiliki oleh satu toko (toko_id).
-- ------------------------------------------------------------
CREATE TABLE bibit_tanaman (
  id           INT            NOT NULL AUTO_INCREMENT,
  toko_id      INT            NOT NULL,
  nama_tanaman VARCHAR(100)   NOT NULL,
  jenis        VARCHAR(50)    NOT NULL,
  deskripsi    TEXT,
  harga        DECIMAL(10,2)  NOT NULL,
  stok         INT            NOT NULL DEFAULT 0,
  gambar       VARCHAR(255)   DEFAULT NULL,
  created_at   TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_bibit_toko FOREIGN KEY (toko_id) REFERENCES toko (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Table: cart
-- Keranjang belanja milik pembeli.
-- ------------------------------------------------------------
CREATE TABLE cart (
  id       INT NOT NULL AUTO_INCREMENT,
  user_id  INT NOT NULL,
  bibit_id INT NOT NULL,
  jumlah   INT NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  UNIQUE KEY uq_cart_item (user_id, bibit_id),
  CONSTRAINT fk_cart_user  FOREIGN KEY (user_id)  REFERENCES users (id)         ON DELETE CASCADE,
  CONSTRAINT fk_cart_bibit FOREIGN KEY (bibit_id) REFERENCES bibit_tanaman (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Table: orders
-- Dalam multi-company, setiap order terikat ke SATU toko.
-- Saat checkout dengan produk dari N toko → dibuat N order terpisah.
-- Status:
--   'pending'   → order dibuat, menunggu pembayaran
--   'paid'      → sudah dibayar, menunggu diproses seller
--   'processed' → seller sedang memproses / mengemas
--   'shipped'   → barang sudah dikirim
--   'completed' → pembeli konfirmasi barang diterima
--   'cancelled' → dibatalkan (oleh pembeli atau seller)
-- ------------------------------------------------------------
CREATE TABLE orders (
  id          INT           NOT NULL AUTO_INCREMENT,
  user_id     INT           NOT NULL,
  toko_id     INT           NOT NULL,
  total_harga DECIMAL(10,2) NOT NULL,
  status      ENUM('pending','paid','processed','shipped','completed','cancelled')
              NOT NULL DEFAULT 'pending',
  catatan     TEXT          DEFAULT NULL,
  created_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_order_user FOREIGN KEY (user_id) REFERENCES users (id)  ON DELETE RESTRICT,
  CONSTRAINT fk_order_toko FOREIGN KEY (toko_id) REFERENCES toko (id)   ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Table: order_items
-- Item-item dalam satu order (semua dari toko yang sama).
-- ------------------------------------------------------------
CREATE TABLE order_items (
  id           INT           NOT NULL AUTO_INCREMENT,
  order_id     INT           NOT NULL,
  bibit_id     INT           NOT NULL,
  nama_tanaman VARCHAR(100)  NOT NULL,
  harga_satuan DECIMAL(10,2) NOT NULL,
  jumlah       INT           NOT NULL,
  subtotal     DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_oi_order FOREIGN KEY (order_id) REFERENCES orders (id)       ON DELETE CASCADE,
  CONSTRAINT fk_oi_bibit FOREIGN KEY (bibit_id) REFERENCES bibit_tanaman (id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Table: reviews
-- Pembeli dapat memberi ulasan produk setelah order completed.
-- ------------------------------------------------------------
CREATE TABLE reviews (
  id         INT  NOT NULL AUTO_INCREMENT,
  user_id    INT  NOT NULL,
  bibit_id   INT  NOT NULL,
  order_id   INT  NOT NULL,
  rating     TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  komentar   TEXT DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_review (user_id, bibit_id, order_id),
  CONSTRAINT fk_review_user  FOREIGN KEY (user_id)  REFERENCES users (id)         ON DELETE CASCADE,
  CONSTRAINT fk_review_bibit FOREIGN KEY (bibit_id) REFERENCES bibit_tanaman (id) ON DELETE CASCADE,
  CONSTRAINT fk_review_order FOREIGN KEY (order_id) REFERENCES orders (id)        ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- SEED DATA
-- ============================================================

-- ------------------------------------------------------------
-- Seed: users
-- password 'admin123'  → bcrypt hash
-- password 'seller123' → bcrypt hash
-- password 'user123'   → bcrypt hash
-- ------------------------------------------------------------
INSERT INTO users (nama, email, password, role) VALUES
  -- Super admin marketplace
  ('Administrator',   'admin@greenseed.id',
   '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lHi6', 'admin'),

  -- Seller 1
  ('Andi Nugroho',    'andi@greenseed.id',
   '$2b$10$YxQk7LmKpHsVqQJ3xGT4OeABrkLm2mCpxHDiRN7bnkFy0vW1Qn.si', 'seller'),

  -- Seller 2
  ('Dewi Lestari',    'dewi@greenseed.id',
   '$2b$10$YxQk7LmKpHsVqQJ3xGT4OeABrkLm2mCpxHDiRN7bnkFy0vW1Qn.si', 'seller'),

  -- Seller 3 (status pending – belum di-approve)
  ('Rudi Hartono',    'rudi@greenseed.id',
   '$2b$10$YxQk7LmKpHsVqQJ3xGT4OeABrkLm2mCpxHDiRN7bnkFy0vW1Qn.si', 'seller'),

  -- Pembeli
  ('Budi Santoso',    'budi@example.com',
   '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.ucrm3yyfW', 'user'),
  ('Siti Rahayu',     'siti@example.com',
   '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.ucrm3yyfW', 'user');

-- ------------------------------------------------------------
-- Seed: toko
-- user_id 2 = Andi (seller), 3 = Dewi (seller), 4 = Rudi (pending)
-- ------------------------------------------------------------
INSERT INTO toko (user_id, nama_toko, deskripsi, alamat, status) VALUES
  (2, 'Taman Bunga Andi',
   'Spesialis bibit bunga dan tanaman hias pilihan. Kami menyediakan bibit berkualitas langsung dari kebun sendiri di Bandung.',
   'Jl. Cihampelas No. 45, Bandung, Jawa Barat',
   'active'),

  (3, 'Kebun Herbal Dewi',
   'Pusat bibit tanaman herbal dan sayuran organik. Semua produk bebas pestisida kimia, cocok untuk urban farming.',
   'Jl. Godean Km. 5, Sleman, DI Yogyakarta',
   'active'),

  (4, 'Bibit Buah Rudi',
   'Menjual berbagai bibit tanaman buah unggul hasil okulasi dan sambung pucuk.',
   'Jl. Pahlawan No. 12, Malang, Jawa Timur',
   'pending');

-- ------------------------------------------------------------
-- Seed: bibit_tanaman
-- toko_id 1 = Taman Bunga Andi
-- toko_id 2 = Kebun Herbal Dewi
-- toko_id 3 = Bibit Buah Rudi (pending, produk tetap ada tapi toko belum active)
-- ------------------------------------------------------------
INSERT INTO bibit_tanaman (toko_id, nama_tanaman, jenis, deskripsi, harga, stok) VALUES
  -- Produk Taman Bunga Andi (toko_id = 1)
  (1, 'Mawar Merah',        'Bunga',
   'Bibit mawar merah berkualitas tinggi, cocok untuk taman dan hiasan rumah. Tinggi tanaman siap tanam ±20 cm.',
   15000, 100),
  (1, 'Melati Putih',       'Bunga',
   'Bibit melati putih harum, tumbuh subur di iklim tropis Indonesia. Sangat cocok untuk pagar hidup.',
   12000, 80),
  (1, 'Anggrek Bulan',      'Bunga',
   'Bibit anggrek bulan premium, bunga tahan lama hingga 3 bulan. Cocok untuk kado dan dekorasi interior.',
   75000, 30),
  (1, 'Bougainvillea Ungu', 'Bunga',
   'Bibit bougainvillea ungu yang rimbun dan tahan panas. Sangat cocok untuk taman tropis dan pergola.',
   20000, 60),

  -- Produk Kebun Herbal Dewi (toko_id = 2)
  (2, 'Cabai Rawit',        'Sayuran',
   'Bibit cabai rawit super pedas, cocok untuk kebun rumahan maupun skala besar. Produktif sepanjang tahun.',
   8000, 150),
  (2, 'Tomat Cherry',       'Sayuran',
   'Bibit tomat cherry produktif, buah kecil manis dan renyah siap panen 60 hari setelah tanam.',
   10000, 120),
  (2, 'Bayam Merah',        'Sayuran',
   'Bibit bayam merah organik bebas pestisida, kaya zat besi dan vitamin A. Panen perdana 25-30 hari.',
   5000, 200),
  (2, 'Lidah Buaya',        'Herbal',
   'Bibit lidah buaya multifungsi untuk perawatan kulit, luka bakar, dan rambut. Sangat mudah dirawat.',
   9000, 90),
  (2, 'Jahe Emprit',        'Herbal',
   'Bibit jahe emprit aromatik pilihan, cocok untuk minuman herbal dan bumbu masak. Tahan berbagai cuaca.',
   11000, 70),
  (2, 'Kunyit Putih',       'Herbal',
   'Bibit kunyit putih berkhasiat tinggi, mudah ditanam di pot maupun tanah langsung. Panen 8-10 bulan.',
   7000, 110),

  -- Produk Bibit Buah Rudi (toko_id = 3)
  (3, 'Mangga Harum Manis', 'Buah',
   'Bibit mangga harum manis hasil okulasi, buah lebat dan manis saat panen di musim kemarau. Mulai berbuah 2-3 tahun.',
   25000, 50),
  (3, 'Jeruk Siam',         'Buah',
   'Bibit jeruk siam seedless berkualitas hasil sambung pucuk, cocok untuk lahan sempit sekalipun.',
   20000, 60),
  (3, 'Alpukat Mentega',    'Buah',
   'Bibit alpukat mentega super, daging tebal dan rasa creamy. Mulai berbuah lebih cepat karena sambung pucuk.',
   35000, 40);

-- ------------------------------------------------------------
-- Seed: cart (Budi sedang berbelanja)
-- user_id 5 = Budi, bibit_id 1 = Mawar Merah, 5 = Cabai Rawit
-- ------------------------------------------------------------
INSERT INTO cart (user_id, bibit_id, jumlah) VALUES
  (5, 1, 2),
  (5, 5, 3);

-- ------------------------------------------------------------
-- Seed: orders (contoh order yang sudah dibuat)
-- user_id 5 = Budi, toko_id 2 = Kebun Herbal Dewi
-- ------------------------------------------------------------
INSERT INTO orders (user_id, toko_id, total_harga, status, catatan) VALUES
  (5, 2, 49000, 'paid',
   'Mohon dikemas dengan hati-hati, untuk bibit yang kecil ya kak.'),
  (6, 1, 39000, 'completed', NULL);

-- ------------------------------------------------------------
-- Seed: order_items
-- order_id 1 → bibit dari Kebun Herbal Dewi
-- order_id 2 → bibit dari Taman Bunga Andi
-- ------------------------------------------------------------
INSERT INTO order_items (order_id, bibit_id, nama_tanaman, harga_satuan, jumlah, subtotal) VALUES
  -- Order 1 (Budi ke Kebun Herbal Dewi) → total = 24000+20000+5000 = 49000
  (1, 5, 'Cabai Rawit',   8000, 3, 24000),
  (1, 6, 'Tomat Cherry', 10000, 2, 20000),
  (1, 7, 'Bayam Merah',   5000, 1,  5000),
  -- Order 2 (Siti ke Taman Bunga Andi) → total = 15000+24000 = 39000
  (2, 1, 'Mawar Merah',  15000, 1, 15000),
  (2, 2, 'Melati Putih', 12000, 2, 24000);

-- ------------------------------------------------------------
-- Seed: reviews (hanya order completed yang bisa review)
-- ------------------------------------------------------------
INSERT INTO reviews (user_id, bibit_id, order_id, rating, komentar) VALUES
  (6, 1, 2, 5, 'Bibit mawarnya bagus banget! Sudah mulai bertunas seminggu setelah tanam. Packing juga aman.'),
  (6, 2, 2, 4, 'Melati sudah mulai berbunga, wangi banget. Pengiriman cepat, recommended!');
