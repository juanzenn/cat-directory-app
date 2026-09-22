import { getCats } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { data: cats } = await getCats();

  return (
    <main className="flex flex-1 flex-col p-8">
      <h1 className="text-3xl font-semibold tracking-tight">Cat Directory</h1>
      <ul>
        {cats.map((cat) => (
          <li key={cat.breed}>
            <strong>{cat.breed}</strong>
            {" — "}
            {cat.country}
          </li>
        ))}
      </ul>
    </main>
  );
}
