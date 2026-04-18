USE car_rental;

-- ============ CATEGORIES ============
INSERT INTO categories (name, description, icon) VALUES
('Economy', 'Budget-friendly cars for everyday use. Fuel-efficient and easy to park.', '🚙'),
('Compact', 'Small but comfortable cars, perfect for city driving.', '🚗'),
('Sedan', 'Mid-size cars with spacious interiors. Great for families.', '🏎️'),
('SUV', 'Sport Utility Vehicles for adventure and rough terrain.', '🚙'),
('Luxury', 'Premium vehicles with top-tier comfort and features.', '✨'),
('Sports', 'High-performance sports cars for thrill seekers.', '🏁');

-- ============ AGENCIES ============
INSERT INTO agencies (name, city, address, phone, email, latitude, longitude) VALUES
('AutoLoc Casablanca Centre', 'Casablanca', '45 Boulevard Mohammed V, Casablanca 20000', '+212 522-123456', 'casa.centre@autoloc.ma', 33.5731104, -7.5898434),
('AutoLoc Rabat Agdal', 'Rabat', '12 Avenue Fal Ould Oumeir, Rabat 10000', '+212 537-654321', 'rabat.agdal@autoloc.ma', 33.9715904, -6.8498129),
('AutoLoc Marrakech Guéliz', 'Marrakech', '78 Avenue Mohammed VI, Marrakech 40000', '+212 524-111222', 'marrakech@autoloc.ma', 31.6294723, -8.0084053),
('AutoLoc Tanger Port', 'Tanger', '3 Rue de la Liberté, Tanger 90000', '+212 539-333444', 'tanger@autoloc.ma', 35.7594651, -5.8339840),
('AutoLoc Fès Médina', 'Fès', '22 Boulevard Allal El Fassi, Fès 30000', '+212 535-555666', 'fes@autoloc.ma', 34.0181246, -5.0078451);

-- ============ CARS ============
INSERT INTO cars (brand, model, year, color, fuel_type, transmission, seats, price_per_day, image_url, available, license_plate, mileage, category_id, agency_id) VALUES
-- Economy
('Dacia', 'Sandero', 2023, 'White', 'petrol', 'manual', 5, 250.00, 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=400', TRUE, 'A-12345-MA', 15000, 1, 1),
('Renault', 'Clio', 2022, 'Silver', 'diesel', 'manual', 5, 280.00, 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=400', TRUE, 'A-23456-MA', 22000, 1, 2),
('Fiat', '500', 2023, 'Red', 'petrol', 'manual', 4, 260.00, 'https://images.unsplash.com/photo-1595787142731-34cfb3432a6e?w=400', TRUE, 'A-34567-MA', 8000, 1, 3),
('Hyundai', 'i10', 2024, 'Blue', 'petrol', 'automatic', 5, 300.00, 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400', FALSE, 'A-45678-MA', 5000, 1, 1),
('Kia', 'Picanto', 2023, 'Yellow', 'petrol', 'manual', 5, 230.00, 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400', TRUE, 'A-56789-MA', 18000, 1, 4),

-- Compact
('Volkswagen', 'Polo', 2023, 'Gray', 'diesel', 'automatic', 5, 350.00, 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=400', TRUE, 'B-12345-MA', 12000, 2, 1),
('Peugeot', '208', 2024, 'Black', 'petrol', 'manual', 5, 320.00, 'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=400', TRUE, 'B-23456-MA', 7000, 2, 2),
('Toyota', 'Yaris', 2023, 'White', 'hybrid', 'automatic', 5, 380.00, 'https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=400', TRUE, 'B-34567-MA', 10000, 2, 3),
('Opel', 'Corsa', 2022, 'Green', 'petrol', 'manual', 5, 310.00, 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1fa?w=400', FALSE, 'B-45678-MA', 25000, 2, 5),
('Citroen', 'C3', 2024, 'Orange', 'diesel', 'automatic', 5, 340.00, 'https://images.unsplash.com/photo-1542362567-b07e54358753?w=400', TRUE, 'B-56789-MA', 3000, 2, 4),

-- Sedan
('Toyota', 'Corolla', 2024, 'Silver', 'hybrid', 'automatic', 5, 450.00, 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=400', TRUE, 'C-12345-MA', 5000, 3, 1),
('Volkswagen', 'Passat', 2023, 'Black', 'diesel', 'automatic', 5, 500.00, 'https://images.unsplash.com/photo-1550355291-bbee04a92027?w=400', TRUE, 'C-23456-MA', 15000, 3, 2),
('Peugeot', '508', 2024, 'Navy Blue', 'diesel', 'automatic', 5, 520.00, 'https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=400', TRUE, 'C-34567-MA', 8000, 3, 3),
('Honda', 'Civic', 2023, 'White', 'petrol', 'manual', 5, 430.00, 'https://images.unsplash.com/photo-1590362891991-f776e747a588?w=400', FALSE, 'C-45678-MA', 20000, 3, 1),
('Skoda', 'Octavia', 2024, 'Gray', 'diesel', 'automatic', 5, 480.00, 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=400', TRUE, 'C-56789-MA', 6000, 3, 5),

-- SUV
('Toyota', 'RAV4', 2024, 'Dark Green', 'hybrid', 'automatic', 5, 650.00, 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=400', TRUE, 'D-12345-MA', 3000, 4, 1),
('Dacia', 'Duster', 2023, 'Brown', 'diesel', 'manual', 5, 420.00, 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=400', TRUE, 'D-23456-MA', 18000, 4, 3),
('Hyundai', 'Tucson', 2024, 'White', 'hybrid', 'automatic', 5, 600.00, 'https://images.unsplash.com/photo-1568844293986-8c3a25c7d7f2?w=400', TRUE, 'D-34567-MA', 7000, 4, 2),
('Kia', 'Sportage', 2023, 'Red', 'diesel', 'automatic', 5, 580.00, 'https://images.unsplash.com/photo-1606611013016-969c19ba27d5?w=400', FALSE, 'D-45678-MA', 14000, 4, 4),
('Volkswagen', 'Tiguan', 2024, 'Black', 'diesel', 'automatic', 5, 680.00, 'https://images.unsplash.com/photo-1616422285623-13ff0162193c?w=400', TRUE, 'D-56789-MA', 4000, 4, 5),

-- Luxury
('BMW', 'Serie 5', 2024, 'Metallic Gray', 'diesel', 'automatic', 5, 1200.00, 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400', TRUE, 'E-12345-MA', 2000, 5, 1),
('Mercedes-Benz', 'Classe E', 2024, 'Black', 'diesel', 'automatic', 5, 1350.00, 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=400', TRUE, 'E-23456-MA', 3000, 5, 2),
('Audi', 'A6', 2023, 'White', 'diesel', 'automatic', 5, 1250.00, 'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?w=400', TRUE, 'E-34567-MA', 8000, 5, 3),
('Volvo', 'S90', 2024, 'Navy Blue', 'hybrid', 'automatic', 5, 1100.00, 'https://images.unsplash.com/photo-1614200187524-dc4b892acf16?w=400', FALSE, 'E-45678-MA', 5000, 5, 1),
('Jaguar', 'XF', 2023, 'British Green', 'petrol', 'automatic', 5, 1400.00, 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=400', TRUE, 'E-56789-MA', 6000, 5, 5),

-- Sports
('Ford', 'Mustang', 2024, 'Red', 'petrol', 'automatic', 4, 1800.00, 'https://images.unsplash.com/photo-1584345604476-8ec5f82d661f?w=400', TRUE, 'F-12345-MA', 1000, 6, 1),
('Chevrolet', 'Camaro', 2023, 'Yellow', 'petrol', 'manual', 4, 1700.00, 'https://images.unsplash.com/photo-1603553329474-99f95f35ea37?w=400', TRUE, 'F-23456-MA', 3000, 6, 2),
('Porsche', '911 Carrera', 2024, 'White', 'petrol', 'automatic', 2, 3500.00, 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?w=400', TRUE, 'F-34567-MA', 500, 6, 1),
('BMW', 'Z4', 2023, 'Metallic Blue', 'petrol', 'automatic', 2, 1600.00, 'https://images.unsplash.com/photo-1556189250-72ba954cfc2b?w=400', FALSE, 'F-45678-MA', 4000, 6, 3),
('Audi', 'TT', 2024, 'Silver', 'petrol', 'automatic', 2, 1500.00, 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=400', TRUE, 'F-56789-MA', 2000, 6, 5);

-- ============ CUSTOMERS ============
INSERT INTO customers (first_name, last_name, email, phone, license_number, birth_date) VALUES
('Yassine', 'Arfaoui', 'yassine.arfaoui@email.com', '+212 661-111111', 'P-123456', '1998-05-15'),
('Fatima', 'El Amrani', 'fatima.elamrani@email.com', '+212 662-222222', 'P-234567', '1995-08-22'),
('Omar', 'Bennani', 'omar.bennani@email.com', '+212 663-333333', 'P-345678', '2000-01-10'),
('Salma', 'Idrissi', 'salma.idrissi@email.com', '+212 664-444444', 'P-456789', '1997-11-30'),
('Karim', 'Tazi', 'karim.tazi@email.com', '+212 665-555555', 'P-567890', '1993-03-18'),
('Nadia', 'Chraibi', 'nadia.chraibi@email.com', '+212 666-666666', 'P-678901', '1999-07-05'),
('Amine', 'Lahlou', 'amine.lahlou@email.com', '+212 667-777777', 'P-789012', '1996-12-25'),
('Hiba', 'Ouazzani', 'hiba.ouazzani@email.com', '+212 668-888888', 'P-890123', '2001-04-14'),
('Mehdi', 'Fassi', 'mehdi.fassi@email.com', '+212 669-999999', 'P-901234', '1994-09-08'),
('Leila', 'Berrada', 'leila.berrada@email.com', '+212 660-000000', 'P-012345', '1998-06-20'),
('Rachid', 'Alaoui', 'rachid.alaoui@email.com', '+212 661-112233', 'P-112233', '1991-02-14'),
('Imane', 'El Mansouri', 'imane.elmansouri@email.com', '+212 662-334455', 'P-334455', '2000-10-01'),
('Hassan', 'Bouazza', 'hassan.bouazza@email.com', '+212 663-556677', 'P-556677', '1997-07-17'),
('Sara', 'Kettani', 'sara.kettani@email.com', '+212 664-778899', 'P-778899', '1999-12-03'),
('Younes', 'Ziani', 'younes.ziani@email.com', '+212 665-990011', 'P-990011', '1995-05-28');

-- ============ RESERVATIONS ============
INSERT INTO reservations (customer_id, car_id, start_date, end_date, total_price, status, notes) VALUES
(1, 1, '2024-12-01', '2024-12-05', 1000.00, 'completed', 'Business trip to Rabat'),
(2, 6, '2024-12-03', '2024-12-07', 1400.00, 'completed', NULL),
(3, 11, '2024-12-10', '2024-12-15', 2250.00, 'completed', 'Family vacation'),
(4, 16, '2024-12-15', '2024-12-20', 3250.00, 'completed', 'Weekend getaway'),
(5, 21, '2024-12-20', '2024-12-25', 6000.00, 'completed', 'VIP client transfer'),
(1, 26, '2024-12-22', '2024-12-24', 3600.00, 'completed', 'Anniversary gift'),
(6, 2, '2025-01-05', '2025-01-10', 1400.00, 'completed', NULL),
(7, 7, '2025-01-08', '2025-01-12', 1280.00, 'completed', 'City tour'),
(8, 12, '2025-01-15', '2025-01-20', 2500.00, 'completed', NULL),
(9, 17, '2025-01-18', '2025-01-22', 1680.00, 'completed', 'Countryside trip'),
(10, 22, '2025-02-01', '2025-02-05', 5400.00, 'completed', 'Wedding transport'),
(11, 3, '2025-02-10', '2025-02-14', 1040.00, 'completed', NULL),
(12, 8, '2025-02-15', '2025-02-19', 1520.00, 'completed', NULL),
(13, 13, '2025-02-20', '2025-02-25', 2600.00, 'completed', 'Business meeting'),
(14, 18, '2025-03-01', '2025-03-05', 2400.00, 'completed', NULL),
(15, 23, '2025-03-10', '2025-03-15', 6250.00, 'completed', 'Luxury experience'),
(1, 5, '2025-03-15', '2025-03-18', 690.00, 'completed', NULL),
(2, 10, '2025-03-20', '2025-03-25', 1700.00, 'completed', 'Spring break'),
(3, 15, '2025-03-28', '2025-04-02', 2400.00, 'completed', NULL),
(4, 20, '2025-04-01', '2025-04-05', 2720.00, 'completed', 'Road trip'),

-- Active/Current reservations
(5, 1, '2025-04-10', '2025-04-18', 2000.00, 'active', 'Extended business trip'),
(6, 11, '2025-04-12', '2025-04-16', 1800.00, 'active', NULL),
(7, 16, '2025-04-13', '2025-04-17', 2600.00, 'active', 'Family trip to Marrakech'),
(8, 21, '2025-04-14', '2025-04-19', 6000.00, 'active', 'VIP transfer'),

-- Confirmed (upcoming)
(9, 6, '2025-04-20', '2025-04-25', 1750.00, 'confirmed', 'Conference in Casablanca'),
(10, 26, '2025-04-22', '2025-04-24', 3600.00, 'confirmed', 'Track day'),
(11, 12, '2025-04-25', '2025-04-30', 2500.00, 'confirmed', NULL),
(12, 17, '2025-04-28', '2025-05-02', 1680.00, 'confirmed', 'Mountain trip'),

-- Pending
(13, 27, '2025-05-01', '2025-05-03', 3400.00, 'pending', NULL),
(14, 22, '2025-05-05', '2025-05-10', 6750.00, 'pending', 'Anniversary celebration'),
(15, 3, '2025-05-08', '2025-05-12', 1040.00, 'pending', NULL),

-- Cancelled
(1, 28, '2025-03-01', '2025-03-05', 14000.00, 'cancelled', 'Changed plans'),
(4, 25, '2025-02-14', '2025-02-16', 2800.00, 'cancelled', 'Weather conditions');

-- ============ REVIEWS ============
INSERT INTO reviews (customer_id, car_id, rating, comment) VALUES
(1, 1, 5, 'Excellent petite voiture! Très économique et parfaite pour la ville. Je recommande vivement.'),
(2, 6, 4, 'Bonne voiture, confortable et bien entretenue. Le GPS intégré est un plus.'),
(3, 11, 5, 'La Toyota Corolla hybride est incroyable. Silencieuse et très économique.'),
(4, 16, 5, 'Le RAV4 est parfait pour les routes marocaines. Très spacieux et confortable.'),
(5, 21, 4, 'BMW Série 5 magnifique. Intérieur luxueux mais la consommation est élevée.'),
(1, 26, 5, 'La Mustang est un rêve! Sensation de conduite incroyable.'),
(6, 2, 3, 'Correcte pour le prix, mais quelques rayures sur la carrosserie.'),
(7, 7, 4, 'La Peugeot 208 est agréable à conduire. Bon rapport qualité-prix.'),
(8, 12, 5, 'Passat très confortable pour les longs trajets. Excellent choix.'),
(9, 17, 4, 'Le Duster est robuste et fiable. Parfait pour aller dans le sud.'),
(10, 22, 5, 'Mercedes Classe E — rien à dire, c est le top du confort.'),
(11, 3, 4, 'Fiat 500 mignonne et pratique en ville. Un peu petite pour les bagages.'),
(12, 8, 5, 'Toyota Yaris hybride, excellente consommation. Très satisfaite.'),
(13, 13, 4, 'Peugeot 508 élégante et puissante. Bonne tenue de route.'),
(14, 18, 3, 'Le Tucson est bien mais le kilométrage était déjà élevé.'),
(15, 23, 5, 'Audi A6 parfaite. Service impeccable de l agence de Marrakech.'),
(1, 5, 4, 'Kia Picanto simple mais efficace pour les petits trajets.'),
(2, 10, 4, 'Citroën C3 avec de bonnes suspensions, confort appréciable.'),
(3, 15, 5, 'Skoda Octavia spacieuse et moderne. Très bonne surprise.'),
(4, 20, 4, 'Tiguan solide et confortable. Idéal pour la famille.'),
(5, 1, 4, 'Deuxième location de la Sandero. Toujours aussi fiable.'),
(6, 11, 5, 'Corolla hybride au top. Consommation ridicule en ville.');
