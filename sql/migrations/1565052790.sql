ALTER TABLE survivor
ADD plyHeadshotsCISmg INT,
ADD plyHeadshotsCIPistol INT,
ADD plyHitsCISmg INT,
ADD plyHitsCIPistol INT,
ADD plyHeadshotsPctSISmg NUMERIC(10, 5),
ADD plyHeadshotsPctSIPistol NUMERIC(10, 5),
ADD plyHeadshotsPctCISmg NUMERIC(10, 5),
ADD plyHeadshotsPctCIPistol NUMERIC(10, 5);

ALTER TABLE infected
ADD infBoomsProxyTotal INT,
ADD infBoomsProxyOnly INT;