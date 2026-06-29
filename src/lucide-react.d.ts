declare module 'lucide-react/dist/esm/icons/*' {
  import { ForwardRefExoticComponent, RefAttributes, SVGProps } from 'react'
  const component: ForwardRefExoticComponent<
    Omit<SVGProps<SVGSVGElement>, 'ref'> & RefAttributes<SVGSVGElement>
  >
  export default component
}
