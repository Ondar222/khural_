// Helpers to make Persons payload compatible with different backend field naming styles.
// Some deployments expect snake_case, others camelCase. We send both for safety.

function isObj(v) {
  return v && typeof v === "object" && !Array.isArray(v);
}

function withFallback(obj, key, fallbackKey) {
  if (!isObj(obj)) return undefined;
  if (obj[key] !== undefined) return obj[key];
  if (obj[fallbackKey] !== undefined) return obj[fallbackKey];
  return undefined;
}

export function toPersonsApiBody(input) {
  const body = isObj(input) ? { ...input } : {};

  // Map biography/bio → description (API expects description)
  if (body.biography !== undefined) {
    body.description = body.biography;
  } else if (body.bio !== undefined) {
    body.description = body.bio;
  }
  delete body.biography;
  delete body.bio;

  // Normalize known fields
  const structureType = withFallback(body, "structureType", "structure_type");
  const convocationNumber = withFallback(body, "convocationNumber", "convocation_number");
  const electoralDistrict = withFallback(body, "electoralDistrict", "electoral_district");
  const phoneNumber = withFallback(body, "phoneNumber", "phone_number");
  const receptionSchedule = withFallback(body, "receptionSchedule", "reception_schedule");

  if (structureType !== undefined) {
    body.structureType = structureType;
    body.structure_type = structureType;
  }
  if (convocationNumber !== undefined) {
    body.convocationNumber = convocationNumber;
    body.convocation_number = convocationNumber;
  }
  if (electoralDistrict !== undefined) {
    body.electoralDistrict = electoralDistrict;
    body.electoral_district = electoralDistrict;
  }
  if (phoneNumber !== undefined) {
    body.phoneNumber = phoneNumber;
    body.phone_number = phoneNumber;
  }
  if (receptionSchedule !== undefined) {
    body.receptionSchedule = receptionSchedule;
    body.reception_schedule = receptionSchedule;
  }

  return body;
}


