import dynamic from 'next/dynamic'

// Keep literal imports inside module-level dynamic calls so Next.js can emit
// preload metadata. Importing the theme synchronously would also eagerly load
// its article renderer on every route.
export const fuwariLayouts = {
  LayoutBase: dynamic(() => import('./index').then(m => m.LayoutBase)),
  LayoutIndex: dynamic(() => import('./index').then(m => m.LayoutIndex)),
  LayoutSlug: dynamic(() => import('./index').then(m => m.LayoutSlug)),
  LayoutPostList: dynamic(() => import('./index').then(m => m.LayoutPostList)),
  LayoutSearch: dynamic(() => import('./index').then(m => m.LayoutSearch)),
  LayoutArchive: dynamic(() => import('./index').then(m => m.LayoutArchive)),
  Layout404: dynamic(() => import('./index').then(m => m.Layout404)),
  LayoutCategoryIndex: dynamic(() => import('./index').then(m => m.LayoutCategoryIndex)),
  LayoutTagIndex: dynamic(() => import('./index').then(m => m.LayoutTagIndex))
}
