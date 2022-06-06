export class Ref {
  excluded = false;

  constructor(typeOrRef) {
    if (typeOrRef instanceof Ref) {
      this.type = typeOrRef.type;
      this.left = false;
      this.link = typeOrRef;
      // eslint-disable-next-line no-param-reassign
      typeOrRef.link = this;
    } else {
      this.type = typeOrRef;
      this.left = true;
      this.link = null;
    }
    this.node = null;
    this.target = null;
    this.isStarRec = this.type === '**';
    this.pointer = null;
    this.completed = false;
  }

  setPointer(pointer) {
    this.pointer = pointer;
    this.link.pointer = pointer;
  }

  setCompleted(state) {
    this.completed = state;
    this.link.completed = state;
  }

  setNode(node) {
    this.node = node;
    this.link.node = node;
  }

  setTarget(target) {
    this.target = target;
    this.link.target = target;
  }
}
