-- ============================================================
-- Database: GreenSeed Marketplace – Bibit Tanaman
-- ============================================================

DROP DATABASE IF EXISTS bibit_tanaman_db;

CREATE DATABASE bibit_tanaman_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE bibit_tanaman_db;

-- ------------------------------------------------------------
-- Table: users
-- ------------------------------------------------------------
CREATE TABLE users (
  id         INT          NOT NULL AUTO_INCREMENT,
  nama       VARCHAR(100) NOT NULL,
  email      VARCHAR(100) NOT NULL UNIQUE,
  password   VARCHAR(255) NOT NULL,
  role       ENUM('user','admin') NOT NULL DEFAULT 'user',
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Table: bibit_tanaman
-- ------------------------------------------------------------
CREATE TABLE bibit_tanaman (
  id           INT            NOT NULL AUTO_INCREMENT,
  nama_tanaman VARCHAR(100)   NOT NULL,
  jenis        VARCHAR(50)    NOT NULL,
  deskripsi    TEXT,
  harga        DECIMAL(10,2)  NOT NULL,
  stok         INT            NOT NULL DEFAULT 0,
  gambar       VARCHAR(255)   DEFAULT NULL,
  created_at   TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Table: cart
-- ------------------------------------------------------------
CREATE TABLE cart (
  id       INT NOT NULL AUTO_INCREMENT,
  user_id  INT NOT NULL,
  bibit_id INT NOT NULL,
  jumlah   INT NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  UNIQUE KEY uq_cart_item (user_id, bibit_id),
  CONSTRAINT fk_cart_user  FOREIGN KEY (user_id)  REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_cart_bibit FOREIGN KEY (bibit_id) REFERENCES bibit_tanaman (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Table: orders
-- ------------------------------------------------------------
CREATE TABLE orders (
  id          INT           NOT NULL AUTO_INCREMENT,
  user_id     INT           NOT NULL,
  total_harga DECIMAL(10,2) NOT NULL,
  status      ENUM('pending','paid','cancelled') NOT NULL DEFAULT 'pending',
  created_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_order_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Table: order_items
-- ------------------------------------------------------------
CREATE TABLE order_items (
  id           INT           NOT NULL AUTO_INCREMENT,
  order_id     INT           NOT NULL,
  bibit_id     INT           NOT NULL,
  nama_tanaman VARCHAR(100)  NOT NULL,
  harga_satuan DECIMAL(10,2) NOT NULL,
  jumlah       INT           NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_oi_order FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
  CONSTRAINT fk_oi_bibit FOREIGN KEY (bibit_id) REFERENCES bibit_tanaman (id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Seed: admin user  (password: admin123)
-- bcrypt hash of "admin123" with saltRounds=10
-- ------------------------------------------------------------
INSERT INTO users (nama, email, password, role) VALUES
  ('Administrator', 'admin@greenseed.id',
   '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lHi6',
   'admin');

-- ------------------------------------------------------------
-- Seed: sample regular users  (password: user123)
-- bcrypt hash of "user123" with saltRounds=10
-- ------------------------------------------------------------
INSERT INTO users (nama, email, password, role) VALUES
  ('Budi Santoso',  'budi@example.com',
   '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.ucrm3yyfW', 'user'),
  ('Siti Rahayu',   'siti@example.com',
   '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.ucrm3yyfW', 'user');

-- ------------------------------------------------------------
-- Seed: bibit_tanaman
-- ------------------------------------------------------------
INSERT INTO bibit_tanaman (nama_tanaman, jenis, deskripsi, harga, stok) VALUES
  ('Mawar Merah',        'Bunga',   'Bibit mawar merah berkualitas tinggi, cocok untuk taman dan hiasan rumah.', 15000, 100),
  ('Melati Putih',       'Bunga',   'Bibit melati putih harum, tumbuh subur di iklim tropis Indonesia.', 12000, 80),
  ('Mangga Harum Manis', 'Buah',    'Bibit mangga harum manis, buah lebat dan manis saat panen di musim kemarau.', 25000, 50),
  ('Jeruk Siam',         'Buah',    'Bibit jeruk siam seedless berkualitas, cocok untuk lahan sempit sekalipun.', 20000, 60),
  ('Cabai Rawit',        'Sayuran', 'Bibit cabai rawit super pedas, cocok untuk kebun rumahan maupun skala besar.', 8000, 150),
  ('Tomat Cherry',       'Sayuran', 'Bibit tomat cherry produktif, buah kecil manis dan renyah siap panen 60 hari.', 10000, 120),
  ('Bayam Merah',        'Sayuran', 'Bibit bayam merah organik bebas pestisida, kaya zat besi dan vitamin A.', 5000, 200),
  ('Lidah Buaya',        'Herbal',  'Bibit lidah buaya multifungsi untuk perawatan jerawat, luka bakar, dan rambut.', 9000, 90),
  ('Jahe Emprit',        'Herbal',  'Bibit jahe emprit aromatik pilihan, cocok untuk minuman herbal dan bumbu masak.', 11000, 70),
  ('Kunyit Putih',       'Herbal',  'Bibit kunyit putih berkhasiat tinggi, mudah ditanam di pot maupun tanah langsung.', 7000, 110);
