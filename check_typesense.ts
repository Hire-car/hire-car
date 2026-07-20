async function main() {
  const res = await fetch("https://ajpdeofzxc954q3ip-1.a1.typesense.net/collections/vehicles/documents/search?q=*&query_by=title", {
    headers: { "X-TYPESENSE-API-KEY": "i3CKINdIzPL9405tlPHv9xGCOn3fZ07C" }
  });
  const data = await res.json();
  console.log(`Found ${data.found} vehicles in Typesense`);
  if (data.hits) {
    console.log(data.hits.map((h: any) => ({ title: h.document.title, city: h.document.city })));
  }
}
main();
