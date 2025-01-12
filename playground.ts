const addressesToUpsert = new Map();
const email = {
  from: { address: "amannnxd@gmail.com", name: "Aman" },
  to: [{ address: "amanmakhija2205@gmail.com", name: "Aman Makhija" }],
  cc: [],
  bcc: [],
  replyTo: [],
};
const all = [
  email.from,
  ...email.to,
  ...email.cc,
  ...email.bcc,
  ...email.replyTo,
];
for (const address of all) {
  addressesToUpsert.set(address.address, address);
}
for (const address of addressesToUpsert.values()) {
  console.log("address", address);
}
