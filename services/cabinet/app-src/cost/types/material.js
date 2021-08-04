class Material extends Cost {
  constructor (props) {
    super(props);
  }
}

Cost.register(Material);

Material.explanation = `Cost to be calculated by number of units or demensions`;
