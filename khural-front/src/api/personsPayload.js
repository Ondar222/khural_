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

function normalizePhoneE164(input) {
  const raw = String(input || "").trim();
  if (!raw) return "";
  // Keep leading + if present, otherwise strip everything except digits.
  const digits = raw.replace(/[^\d+]/g, "");
  const plus = digits.startsWith("+");
  const nums = digits.replace(/[^\d]/g, "");
  if (!nums) return "";

  // Russia common formats:
  // - 8XXXXXXXXXX -> +7XXXXXXXXXX
  // - 7XXXXXXXXXX -> +7XXXXXXXXXX
  // - XXXXXXXXXX  -> +7XXXXXXXXXX
  if (nums.length === 11 && nums.startsWith("8")) return `+7${nums.slice(1)}`;
  if (nums.length === 11 && nums.startsWith("7")) return `+${nums}`;
  if (nums.length === 10) return `+7${nums}`;
  // fallback: if original had + keep it, else return digits only (may still be rejected by backend)
  return plus ? `+${nums}` : nums;
}

function normalizeEmail(input) {
  const s = String(input || "").trim();
  if (!s) return "";
  // Very light sanity check; backend will still validate IsEmail.
  if (!s.includes("@")) return "";
  return s;
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
  const email = withFallback(body, "email", "email");

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
    const normalized = normalizePhoneE164(phoneNumber);
    // If we can't normalize, don't send invalid value (backend validates IsPhoneNumber)
    if (normalized) {
      body.phoneNumber = normalized;
      body.phone_number = normalized;
    } else {
      delete body.phoneNumber;
      delete body.phone_number;
    }
  }
  if (email !== undefined) {
    const normalized = normalizeEmail(email);
    if (normalized) {
      body.email = normalized;
    } else {
      delete body.email;
    }
  }
  if (receptionSchedule !== undefined) {
    // Backend expects an object. Admin UI may send a string; store it as notes.
    if (typeof receptionSchedule === "string") {
      const s = receptionSchedule.trim();
      if (s) {
        const obj = { notes: s };
        body.receptionSchedule = obj;
        body.reception_schedule = obj;
      } else {
        delete body.receptionSchedule;
        delete body.reception_schedule;
      }
    } else {
      body.receptionSchedule = receptionSchedule;
      body.reception_schedule = receptionSchedule;
    }
  }

  return body;
}


