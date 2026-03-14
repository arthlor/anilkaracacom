import Callout from '../Callout.astro';
import CodeBlock from '../CodeBlock.astro';

export const mdxComponents = {
  blockquote: Callout,
  pre: CodeBlock,
};
