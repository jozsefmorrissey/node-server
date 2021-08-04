class ConditionalCost extends Cost {
  constructor (props) {
    super(props);
  }
}

ConditionalCost.conditions = {};
ConditionalCost.conditions.EQUAL = 'Equals';
ConditionalCost.conditions.NOT_EQUAL = 'Not Equal';
ConditionalCost.conditions.LESS_THAN = 'Less Than';
ConditionalCost.conditions.GREATER_THAN = 'Greater Than';
ConditionalCost.conditions.LESS_THAN_EQUAL = 'Less Than Or Equal';
ConditionalCost.conditions.GREATER_THAN_EQUAL = 'Greater Than Or Equal';

ConditionalCost.explanation = `A cost that is applied if the a defined
                                condition is met`;

Cost.register(ConditionalCost);
