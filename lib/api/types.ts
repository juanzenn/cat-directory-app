export type CatFact = {
  fact: string;
  length: number;
};

export type Breed = {
  breed: string;
  country: string;
  origin: string;
  coat: string;
  pattern: string;
};

export type Paginated<T> = {
  current_page: number;
  data: T[];
  per_page: number;
  total: number;
  last_page: number;
  next_page_url: string | null;
  prev_page_url: string | null;
};

export type GetCatsParams = {
  page?: number;
  limit?: number;
};
