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

function normalizeBool(input) {
  if (input === true || input === false) return input;
  if (input === 1 || input === 0) return Boolean(input);
  const s = String(input ?? "").trim().toLowerCase();
  if (!s) return undefined;
  if (["true", "1", "yes", "y", "да"].includes(s)) return true;
  if (["false", "0", "no", "n", "нет"].includes(s)) return false;
  return undefined;
}

function normalizeStringArray(input) {
  const arr = Array.isArray(input) ? input : input ? [input] : [];
  const out = arr.map((x) => String(x ?? "").trim()).filter(Boolean);
  return out.length ? out : undefined;
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
  const mandateEnded = withFallback(body, "mandateEnded", "mandate_ended");
  const isDeceased = withFallback(body, "isDeceased", "is_deceased");
  const mandateEndDate = withFallback(body, "mandateEndDate", "mandate_end_date");
  const mandateEndReason = withFallback(body, "mandateEndReason", "mandate_end_reason");
  const factionIds = withFallback(body, "factionIds", "faction_ids");
  const districtIds = withFallback(body, "districtIds", "district_ids");
  const convocationIds = withFallback(body, "convocationIds", "convocation_ids");
  const categoryIds = withFallback(body, "categoryIds", "category_ids");

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

  // Relations (IDs)
  const fIds = normalizeStringArray(factionIds);
  if (fIds) {
    body.factionIds = fIds;
    body.faction_ids = fIds;
  }
  const dIds = normalizeStringArray(districtIds);
  if (dIds) {
    body.districtIds = dIds;
    body.district_ids = dIds;
  }
  const cIds = normalizeStringArray(convocationIds);
  if (cIds) {
    body.convocationIds = cIds;
    body.convocation_ids = cIds;
  }
  const catIds = normalizeStringArray(categoryIds);
  if (catIds) {
    body.categoryIds = catIds;
    body.category_ids = catIds;
  }

  // Status fields
  const ended = normalizeBool(mandateEnded);
  if (ended !== undefined) {
    body.mandateEnded = ended;
    body.mandate_ended = ended;
  }
  const deceased = normalizeBool(isDeceased);
  if (deceased !== undefined) {
    body.isDeceased = deceased;
    body.is_deceased = deceased;
    if (deceased) {
      body.mandateEnded = true;
      body.mandate_ended = true;
    }
  }
  if (mandateEndDate !== undefined && mandateEndDate !== null && mandateEndDate !== "") {
    const n = Number(mandateEndDate);
    if (!Number.isNaN(n)) {
      body.mandateEndDate = n;
      body.mandate_end_date = n;
    }
  }
  if (mandateEndReason !== undefined) {
    const s = String(mandateEndReason || "").trim();
    if (s) {
      body.mandateEndReason = s;
      body.mandate_end_reason = s;
    } else {
      delete body.mandateEndReason;
      delete body.mandate_end_reason;
    }
  }

  return body;
}


