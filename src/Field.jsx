import React from 'react'

import ConditionalContextWrapper from './ConditionalContext'
import InputField from './fields/InputField'
import FormolContextWrapper from './FormolContext'
import { block } from './utils'
import { diff, get } from './utils/object'

let UNAMED_COUNT = 0

@ConditionalContextWrapper
@FormolContextWrapper
@block
export default class Field extends React.PureComponent {
  static defaultProps = {
    formatter: v => (v && v.trim ? v.trim() : v),
    normalizer: v => v,
    unformatter: v => v,
  }

  constructor(props) {
    super(props)
    if (props.value) {
      throw new Error(
        `Do not use value on fields.
        Set a value for this field in the form item attribute.`
      )
    }
    if (props.name) {
      this.name = props.name
    } else if (typeof props.children === 'string') {
      this.name = props.children
        .toLowerCase()
        .replace(/\W+(.)/g, (match, chr) => chr.toUpperCase())
    } else {
      this.name = `field-${++UNAMED_COUNT}`
    }

    props = this.getProps(props)
    this.element = React.createRef()
    this.state = {
      focus: false,
    }
    props.context.register(props.name, this.element, props.validator)
    props.conditionalContext.register &&
      props.conditionalContext.register(props.name)

    this.handleChange = this.handleChange.bind(this)
    this.handleFocus = this.handleFocus.bind(this)
    this.handleBlur = this.handleBlur.bind(this)
  }

  componentDidUpdate(oldProps) {
    const {
      context: { transientItem: oldTransientItem },
    } = oldProps
    const {
      name,
      context: { transientItem, handleChanged },
    } = this.getProps(this.props)
    const propsDiff = diff(this.props, oldProps, Object.keys(this.props))
    if (
      get(transientItem, name) !== get(oldTransientItem, name) ||
      (Object.keys(propsDiff).length &&
        !Object.keys(propsDiff).every(prop =>
          ['context', 'conditionalContext'].includes(prop)
        ))
    ) {
      handleChanged(name)
    }
  }

  getProps(props) {
    const TypeField = props.context.types[props.type] || InputField
    const propsOverrideFromField = TypeField.defaultFieldProps
      ? Object.entries(TypeField.defaultFieldProps).reduce(
          (newProps, [name, getter]) => {
            newProps[name] = getter(props)
            return newProps
          },
          {}
        )
      : {}

    return {
      ...props,
      name: this.name,
      ...propsOverrideFromField,
      ...props.conditionalContext.propsOverride,
    }
  }

  handleChange(value, error) {
    const {
      name,
      unformatter,
      context: { handleChange },
    } = this.getProps(this.props)
    handleChange(name, unformatter(value), error)
  }

  handleFocus() {
    this.setState({
      focus: true,
    })
  }

  handleBlur() {
    const {
      name,
      normalizer,
      context: { transientItem, handleChange, handleEntered },
    } = this.getProps(this.props)
    const value = get(transientItem, name)
    // Normalize data
    const normalized = normalizer(value)
    if (normalized !== value) {
      handleChange(name, normalized)
    }
    this.setState({
      focus: false,
    })
    handleEntered(name)
  }

  render(b) {
    const {
      name,
      type,
      className,
      validator,
      readOnly: fieldReadOnly,
      unit,
      extras,
      formatter,
      normalizer,
      unformatter,
      children,
      context,
      conditionalContext,
      ...props
    } = this.getProps(this.props)

    const {
      item,
      transientItem,
      types,
      i18n,
      errors,
      readOnly: formReadOnly,
      enteredFields,
      handleKeyDown,
    } = context

    const readOnly = formReadOnly || fieldReadOnly
    const { focus } = this.state

    if (!transientItem) {
      throw new Error('Field must be used inside Form')
    }
    const itemValue = get(item, name)
    const transientValue = get(transientItem, name)
    const modified = itemValue !== transientValue
    const value = formatter(transientValue)

    const TypeField = types[type] || InputField
    const Label = TypeField.formolFieldLabelElement || 'label'
    const error =
      enteredFields.includes(name) && errors[name] ? errors[name] : null
    return (
      <div
        className={b.mix(className).m({
          type,
          name,
          error: !!error,
          readOnly,
          required: !!props.required,
          modified,
          focus,
        })}
      >
        <Label className={b.e('label')}>
          <TypeField
            name={name}
            value={value}
            type={type}
            readOnly={readOnly}
            i18n={i18n}
            elementRef={this.element}
            className={b.e('field')}
            onFocus={this.handleFocus}
            onBlur={this.handleBlur}
            onChange={this.handleChange}
            onKeyDown={handleKeyDown}
            {...props}
          />
          {unit && <div className={b.e('unit')}>{unit}</div>}
          {children && <span className={b.e('label-text')}>{children}</span>}
          {extras}
        </Label>
        {error && <div className={b.e('error')}>{error}</div>}
      </div>
    )
  }
}
