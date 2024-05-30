import { OFSOpenMessage, OFSPlugin } from "../libs/ofs/main";
export class CustomPlugin extends OFSPlugin {
  setState: any;
  data: OFSOpenMessage = new OFSOpenMessage();
  open(data: OFSOpenMessage): void {
    console.log(`${this.tag}: Open message received: forcing redraw`, data);
    this.setState(data);
  }
  constructor() {
    super("field-quoting");
  }
}
