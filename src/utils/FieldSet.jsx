import React from 'react'

import BooleanField from '../fields/BooleanField'
import { block } from '../utils'

@block
export default class FieldSet extends React.PureComponent {
  render(b) {
    const {
      type,
      isChecked,
      value,
      choices,
      elementRef,
      onChange,
      ...props
    } = this.props
    return (
      <fieldset className={b} ref={elementRef}>
        {choices.map(([choiceLabel, choice]) => (
          <label
            key={choice}
            className={b.e('label').m({ on: isChecked(choice, value) })}
          >
            <BooleanField
              {...props}
              type={type}
              value={isChecked(choice, value)}
              onChange={checked => onChange(choice, value, checked)}
            />
            <span className={b.e('title')}>{choiceLabel}</span>
          </label>
        ))}
      </fieldset>
    )
  }
}
