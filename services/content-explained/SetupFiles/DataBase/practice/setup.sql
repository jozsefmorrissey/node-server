CREATE TABLE personel (
  name VARCHAR(64) UNIQUE,
  age BIGINT,
  dept VARCHAR(64),
  manager VARCHAR(64),
  sex VARCHAR(64)
);


INSERT INTO personel (name, age, dept, manager, sex) VALUES ('Fred', 55, 'IT', 'Winstean', 'male');
INSERT INTO personel (name, age, dept, manager, sex) VALUES ('James', 23, 'IT', 'Fred', 'male');
INSERT INTO personel (name, age, dept, manager, sex) VALUES ('Chad', 15, 'Claims', 'Jenny', 'male');
INSERT INTO personel (name, age, dept, manager, sex) VALUES ('Greg', 30, 'Billing', 'Gladus', 'male');
INSERT INTO personel (name, age, dept, manager, sex) VALUES ('Winstean', 42, 'Owner', '', 'male');


INSERT INTO personel (name, age, dept, manager, sex) VALUES ('Jenny', 16, 'Claims', 'Winstean', 'female');
INSERT INTO personel (name, age, dept, manager, sex) VALUES ('Gladus', 61, 'Billing', 'Winstean', 'female');
INSERT INTO personel (name, age, dept, manager, sex) VALUES ('Heather', 32, 'Claims', 'Jenny', 'female');
INSERT INTO personel (name, age, dept, manager, sex) VALUES ('Shannana', 21, 'IT', 'Fred', 'female');
