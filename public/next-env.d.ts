/// <reference types="next" />
/// <reference types="next/types/global" />

module '*.svg' {
  declare const x: React.FC<React.SVGProps<SVGSVGElement>>;

  export default x;
}
