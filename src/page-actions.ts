interface ActionPage {
  id?: string;
  status: string;
  photo?: unknown;
  photoBlob?: unknown;
  canvas?: unknown;
  inputBlob?: unknown;
  paras?: readonly { place?: unknown }[] | null;
}

/** Tools for the selected page; ordering limits and photo/source requirements live together. */
export function pageActions(page: ActionPage | undefined, context: { index: number; count: number; editable: boolean; pageView: boolean }) {
  const done = page?.status === "done", pending = page?.status === "wait" || page?.status === "ocr";
  const laidOut = done && context.pageView;
  const input = !!(page?.canvas || page?.inputBlob);
  return { crop: !!(page?.photo || page?.photoBlob), recognise: input && !pending, regions: input && !pending,
    move: laidOut, reset: laidOut && !!page?.paras?.some(pa => pa.place), phrases: done,
    photos: !!page?.id && context.editable, earlier: !!page && context.index > 0, later: !!page && context.index < context.count - 1, delete: !!page && context.count > 1, check: done };
}
