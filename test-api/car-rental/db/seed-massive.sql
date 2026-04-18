USE car_rental;

-- Generate 200 more customers using a procedure
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS generate_customers()
BEGIN
  DECLARE i INT DEFAULT 16;
  DECLARE fnames VARCHAR(500) DEFAULT 'Ahmed,Mohamed,Youssef,Amine,Hassan,Rachid,Hamza,Adil,Khalid,Nabil,Samir,Kamal,Brahim,Mustapha,Othmane,Soufiane,Zakaria,Driss,Fouad,Jawad,Redouane,Aziz,Tarik,Larbi,Mounir,Badr,Ayoub,Walid,Ilyas,Sami,Fatima,Amina,Salma,Nadia,Hiba,Leila,Samira,Khadija,Meryem,Zineb,Hajar,Sanaa,Loubna,Imane,Noura,Asmaa,Houda,Siham,Lamia,Nawal';
  DECLARE lnames VARCHAR(500) DEFAULT 'Alaoui,Bennani,Idrissi,Tazi,Chraibi,Fassi,Berrada,El Amrani,Ouazzani,Lahlou,Kettani,Ziani,Bouazza,El Mansouri,Hakimi,Benkirane,Regragui,Senhaji,Squalli,Filali,Guedira,Amrani,Berrechid,Hajji,Sefrioui,Cherkaoui,Tahiri,Boucetta,Kabbaj,Naciri';
  DECLARE fname VARCHAR(50);
  DECLARE lname VARCHAR(50);
  DECLARE fname_count INT DEFAULT 50;
  DECLARE lname_count INT DEFAULT 30;

  WHILE i <= 215 DO
    SET fname = SUBSTRING_INDEX(SUBSTRING_INDEX(fnames, ',', 1 + (i % fname_count)), ',', -1);
    SET lname = SUBSTRING_INDEX(SUBSTRING_INDEX(lnames, ',', 1 + ((i * 7) % lname_count)), ',', -1);

    INSERT IGNORE INTO customers (first_name, last_name, email, phone, license_number, birth_date)
    VALUES (
      fname,
      lname,
      CONCAT(LOWER(fname), '.', LOWER(REPLACE(lname, ' ', '')), i, '@email.com'),
      CONCAT('+212 6', LPAD(FLOOR(RAND() * 100000000), 8, '0')),
      CONCAT('P-', LPAD(i * 111, 6, '0')),
      DATE_ADD('1970-01-01', INTERVAL FLOOR(RAND() * 15000) DAY)
    );
    SET i = i + 1;
  END WHILE;
END //
DELIMITER ;

CALL generate_customers();
DROP PROCEDURE IF EXISTS generate_customers;

-- Generate 170 more cars (total ~200)
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS generate_cars()
BEGIN
  DECLARE i INT DEFAULT 31;
  DECLARE brands VARCHAR(300) DEFAULT 'Toyota,Volkswagen,Renault,Peugeot,Dacia,Hyundai,Kia,BMW,Mercedes-Benz,Audi,Ford,Chevrolet,Fiat,Honda,Nissan,Mazda,Citroen,Opel,Skoda,Volvo,Seat,Suzuki,Mitsubishi,Jeep,Land Rover';
  DECLARE models_eco VARCHAR(200) DEFAULT 'Sandero,Clio,Rio,i10,Picanto,Logan,Fiesta,Micra,Swift,Fabia';
  DECLARE models_compact VARCHAR(200) DEFAULT 'Polo,208,Yaris,Corsa,C3,Ibiza,Jazz,Note,Baleno,Scala';
  DECLARE models_sedan VARCHAR(200) DEFAULT 'Corolla,Passat,508,Civic,Octavia,Jetta,Altima,Mazda3,C4,Megane';
  DECLARE models_suv VARCHAR(200) DEFAULT 'RAV4,Duster,Tucson,Sportage,Tiguan,CR-V,Qashqai,CX-5,3008,Ateca';
  DECLARE models_lux VARCHAR(200) DEFAULT 'Serie 5,Classe E,A6,S90,XF,Serie 3,Classe C,A4,V60,ES';
  DECLARE models_sport VARCHAR(200) DEFAULT 'Mustang,Camaro,911,Z4,TT,GT86,MX-5,370Z,BRZ,Supra';
  DECLARE colors VARCHAR(200) DEFAULT 'White,Black,Silver,Gray,Red,Blue,Green,Navy Blue,Brown,Metallic Gray,Yellow,Orange,Burgundy,Beige,Dark Green';
  DECLARE brand VARCHAR(50);
  DECLARE model_name VARCHAR(50);
  DECLARE car_color VARCHAR(50);
  DECLARE cat_id INT;
  DECLARE fuel VARCHAR(10);
  DECLARE trans VARCHAR(10);

  WHILE i <= 200 DO
    SET cat_id = 1 + (i % 6);
    SET brand = SUBSTRING_INDEX(SUBSTRING_INDEX(brands, ',', 1 + (i % 25)), ',', -1);

    SET model_name = CASE cat_id
      WHEN 1 THEN SUBSTRING_INDEX(SUBSTRING_INDEX(models_eco, ',', 1 + (i % 10)), ',', -1)
      WHEN 2 THEN SUBSTRING_INDEX(SUBSTRING_INDEX(models_compact, ',', 1 + (i % 10)), ',', -1)
      WHEN 3 THEN SUBSTRING_INDEX(SUBSTRING_INDEX(models_sedan, ',', 1 + (i % 10)), ',', -1)
      WHEN 4 THEN SUBSTRING_INDEX(SUBSTRING_INDEX(models_suv, ',', 1 + (i % 10)), ',', -1)
      WHEN 5 THEN SUBSTRING_INDEX(SUBSTRING_INDEX(models_lux, ',', 1 + (i % 10)), ',', -1)
      ELSE SUBSTRING_INDEX(SUBSTRING_INDEX(models_sport, ',', 1 + (i % 10)), ',', -1)
    END;

    SET car_color = SUBSTRING_INDEX(SUBSTRING_INDEX(colors, ',', 1 + (i % 15)), ',', -1);
    SET fuel = ELT(1 + (i % 4), 'petrol', 'diesel', 'hybrid', 'electric');
    SET trans = IF(i % 3 = 0, 'automatic', 'manual');

    INSERT INTO cars (brand, model, year, color, fuel_type, transmission, seats, price_per_day, image_url, available, license_plate, mileage, category_id, agency_id)
    VALUES (
      brand, model_name,
      2022 + (i % 3),
      car_color, fuel, trans,
      IF(cat_id = 6, 2, 5),
      CASE cat_id WHEN 1 THEN 200 + (i % 150) WHEN 2 THEN 300 + (i % 150) WHEN 3 THEN 400 + (i % 200) WHEN 4 THEN 500 + (i % 250) WHEN 5 THEN 900 + (i % 600) ELSE 1200 + (i % 1000) END,
      CONCAT('https://images.unsplash.com/photo-', 1500000000 + (i * 1111111), '?w=400'),
      IF(i % 5 = 0, FALSE, TRUE),
      CONCAT(CHAR(65 + (cat_id - 1)), '-', LPAD(i * 111, 5, '0'), '-MA'),
      FLOOR(RAND() * 80000),
      cat_id,
      1 + (i % 5)
    );
    SET i = i + 1;
  END WHILE;
END //
DELIMITER ;

CALL generate_cars();
DROP PROCEDURE IF EXISTS generate_cars;

-- Generate 1500+ reservations
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS generate_reservations()
BEGIN
  DECLARE i INT DEFAULT 34;
  DECLARE cust_id INT;
  DECLARE c_id INT;
  DECLARE s_date DATE;
  DECLARE e_date DATE;
  DECLARE days_count INT;
  DECLARE ppd DECIMAL(10,2);
  DECLARE stat VARCHAR(20);
  DECLARE notes_arr VARCHAR(500) DEFAULT 'Business trip,Family vacation,Weekend getaway,Conference,Road trip,Wedding,Airport transfer,City tour,University visit,Holiday,Anniversary,Team building,Client meeting,Site visit,Moving day';

  WHILE i <= 1500 DO
    SET cust_id = 1 + (i % 200);
    SET c_id = 1 + (i % 200);
    SET s_date = DATE_ADD('2024-06-01', INTERVAL FLOOR(i / 5) DAY);
    SET days_count = 1 + (i % 10);
    SET e_date = DATE_ADD(s_date, INTERVAL days_count DAY);

    SELECT price_per_day INTO ppd FROM cars WHERE id = c_id LIMIT 1;
    IF ppd IS NULL THEN SET ppd = 350; END IF;

    SET stat = CASE
      WHEN s_date < '2025-03-01' THEN 'completed'
      WHEN s_date < '2025-04-10' THEN ELT(1 + (i % 3), 'completed', 'completed', 'cancelled')
      WHEN s_date < '2025-04-15' THEN 'active'
      WHEN s_date < '2025-05-01' THEN 'confirmed'
      ELSE 'pending'
    END;

    INSERT INTO reservations (customer_id, car_id, start_date, end_date, total_price, status, notes)
    VALUES (
      cust_id, c_id, s_date, e_date,
      ppd * days_count,
      stat,
      IF(i % 3 = 0, SUBSTRING_INDEX(SUBSTRING_INDEX(notes_arr, ',', 1 + (i % 15)), ',', -1), NULL)
    );
    SET i = i + 1;
  END WHILE;
END //
DELIMITER ;

CALL generate_reservations();
DROP PROCEDURE IF EXISTS generate_reservations;

-- Generate 500+ reviews
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS generate_reviews()
BEGIN
  DECLARE i INT DEFAULT 23;
  DECLARE comments_fr VARCHAR(1000) DEFAULT 'Excellente voiture très bien entretenue,Service impeccable et voiture propre,Bon rapport qualité-prix pour la catégorie,Voiture confortable et agréable à conduire,Très satisfait de la location,Kilométrage un peu élevé mais fonctionne bien,Parfait pour les routes marocaines,Je recommande vivement cette agence,Bonne expérience globale,La climatisation marche très bien,Consommation raisonnable en ville,GPS intégré très pratique,Intérieur spacieux et propre,Un peu bruyant sur autoroute mais correct,Retour du véhicule facile et rapide';

  WHILE i <= 550 DO
    INSERT INTO reviews (customer_id, car_id, rating, comment)
    VALUES (
      1 + (i % 200),
      1 + (i % 200),
      CASE WHEN i % 10 < 3 THEN 5 WHEN i % 10 < 6 THEN 4 WHEN i % 10 < 8 THEN 3 ELSE 2 + (i % 2) END,
      SUBSTRING_INDEX(SUBSTRING_INDEX(comments_fr, ',', 1 + (i % 15)), ',', -1)
    );
    SET i = i + 1;
  END WHILE;
END //
DELIMITER ;

CALL generate_reviews();
DROP PROCEDURE IF EXISTS generate_reviews;

-- Summary
SELECT
  (SELECT COUNT(*) FROM customers) as total_customers,
  (SELECT COUNT(*) FROM cars) as total_cars,
  (SELECT COUNT(*) FROM reservations) as total_reservations,
  (SELECT COUNT(*) FROM reviews) as total_reviews;
