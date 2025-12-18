const genNormalizePhone = (phone: string) => {
  phone = phone.replace(/\D/g, "");
  if (phone.startsWith("8")) {
    phone = "7" + phone.slice(1);
  }

  return phone;
};

export { genNormalizePhone };