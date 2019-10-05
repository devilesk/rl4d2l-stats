import QueryBuilder from 'jQuery-QueryBuilder';

QueryBuilder.templates.group = '\
<div id="{{= it.group_id }}" class="rules-group-container card bg-light"> \
  <div class="rules-group-header"> \
    {{? it.level>1 }} \
      <button type="button" class="btn btn-sm btn-danger float-right ml-1" data-delete="group"> \
        <i class="{{= it.icons.remove_group }}"></i> {{= it.translate("delete_group") }} \
      </button> \
    {{?}} \
    <div class="btn-group ml-1 float-right group-actions"> \
      <button type="button" class="btn btn-sm btn-primary" data-add="rule"> \
        <i class="{{= it.icons.add_rule }}"></i> {{= it.translate("add_rule") }} \
      </button> \
      {{? it.settings.allow_groups===-1 || it.settings.allow_groups>=it.level }} \
        <button type="button" class="btn btn-sm btn-primary" data-add="group"> \
          <i class="{{= it.icons.add_group }}"></i> {{= it.translate("add_group") }} \
        </button> \
      {{?}} \
    </div> \
    <div class="btn-group group-conditions"> \
      {{~ it.conditions: condition }} \
        <label class="btn btn-sm btn-primary"> \
          <input type="radio" name="{{= it.group_id }}_cond" value="{{= condition }}"> {{= it.translate("conditions", condition) }} \
        </label> \
      {{~}} \
    </div> \
    {{? it.settings.display_errors }} \
      <div class="error-container"><i class="{{= it.icons.error }}"></i></div> \
    {{?}} \
  </div> \
  <div class=rules-group-body> \
    <div class=rules-list></div> \
  </div> \
</div>';

QueryBuilder.templates.rule = '\
<div id="{{= it.rule_id }}" class="rule-container d-flex flex-row card"> \
  {{? it.settings.display_errors }} \
    <div class="error-container"><i class="{{= it.icons.error }}"></i></div> \
  {{?}} \
  <div class="rule-filter-container"></div> \
  <div class="rule-operator-container"></div> \
  <div class="rule-value-container"></div> \
  <div class="rule-header ml-auto"> \
    <div class="btn-group pull-right rule-actions"> \
      <button type="button" class="btn btn-sm btn-danger" data-delete="rule"> \
        <i class="{{= it.icons.remove_rule }}"></i> {{= it.translate("delete_rule") }} \
      </button> \
    </div> \
  </div> \
</div>';

QueryBuilder.templates.filterSelect = '\
{{ var optgroup = null; }} \
<select class="form-control form-control-sm" name="{{= it.rule.id }}_filter"> \
  {{? it.settings.display_empty_filter }} \
    <option value="-1">{{= it.settings.select_placeholder }}</option> \
  {{?}} \
  {{~ it.filters: filter }} \
    {{? optgroup !== filter.optgroup }} \
      {{? optgroup !== null }}</optgroup>{{?}} \
      {{? (optgroup = filter.optgroup) !== null }} \
        <optgroup label="{{= it.translate(it.settings.optgroups[optgroup]) }}"> \
      {{?}} \
    {{?}} \
    <option value="{{= filter.id }}" {{? filter.icon}}data-icon="{{= filter.icon}}"{{?}}>{{= it.translate(filter.label) }}</option> \
  {{~}} \
  {{? optgroup !== null }}</optgroup>{{?}} \
</select>';

QueryBuilder.templates.operatorSelect = '\
{{? it.operators.length === 1 }} \
<span> \
{{= it.translate("operators", it.operators[0].type) }} \
</span> \
{{?}} \
{{ var optgroup = null; }} \
<select class="form-control form-control-sm {{? it.operators.length === 1 }}hide{{?}}" name="{{= it.rule.id }}_operator"> \
  {{~ it.operators: operator }} \
    {{? optgroup !== operator.optgroup }} \
      {{? optgroup !== null }}</optgroup>{{?}} \
      {{? (optgroup = operator.optgroup) !== null }} \
        <optgroup label="{{= it.translate(it.settings.optgroups[optgroup]) }}"> \
      {{?}} \
    {{?}} \
    <option value="{{= operator.type }}" {{? operator.icon}}data-icon="{{= operator.icon}}"{{?}}>{{= it.translate("operators", operator.type) }}</option> \
  {{~}} \
  {{? optgroup !== null }}</optgroup>{{?}} \
</select>';

QueryBuilder.templates.ruleValueSelect = '\
{{ var optgroup = null; }} \
<select class="form-control form-control-sm" name="{{= it.name }}" {{? it.rule.filter.multiple }}multiple{{?}}> \
  {{? it.rule.filter.placeholder }} \
    <option value="{{= it.rule.filter.placeholder_value }}" disabled selected>{{= it.rule.filter.placeholder }}</option> \
  {{?}} \
  {{~ it.rule.filter.values: entry }} \
    {{? optgroup !== entry.optgroup }} \
      {{? optgroup !== null }}</optgroup>{{?}} \
      {{? (optgroup = entry.optgroup) !== null }} \
        <optgroup label="{{= it.translate(it.settings.optgroups[optgroup]) }}"> \
      {{?}} \
    {{?}} \
    <option value="{{= entry.value }}">{{= entry.label }}</option> \
  {{~}} \
  {{? optgroup !== null }}</optgroup>{{?}} \
</select>';

QueryBuilder.prototype.getRuleInput = function(rule, value_id) {
    var filter = rule.filter;
    var validation = rule.filter.validation || {};
    var name = rule.id + '_value_' + value_id;
    var c = filter.vertical ? ' class=block' : '';
    var h = '';

    if (typeof filter.input == 'function') {
        h = filter.input.call(this, rule, name);
    }
    else {
        switch (filter.input) {
            case 'radio':
            case 'checkbox':
                Utils.iterateOptions(filter.values, function(key, val) {
                    h += '<label' + c + '><input type="' + filter.input + '" name="' + name + '" value="' + key + '"> ' + val + '</label> ';
                });
                break;

            case 'select':
                h = this.getRuleValueSelect(name, rule);
                break;

            case 'textarea':
                h += '<textarea class="form-control form-control-sm" name="' + name + '"';
                if (filter.size) h += ' cols="' + filter.size + '"';
                if (filter.rows) h += ' rows="' + filter.rows + '"';
                if (validation.min !== undefined) h += ' minlength="' + validation.min + '"';
                if (validation.max !== undefined) h += ' maxlength="' + validation.max + '"';
                if (filter.placeholder) h += ' placeholder="' + filter.placeholder + '"';
                h += '></textarea>';
                break;

            case 'number':
                h += '<input class="form-control form-control-sm" type="number" name="' + name + '"';
                if (validation.step !== undefined) h += ' step="' + validation.step + '"';
                if (validation.min !== undefined) h += ' min="' + validation.min + '"';
                if (validation.max !== undefined) h += ' max="' + validation.max + '"';
                if (filter.placeholder) h += ' placeholder="' + filter.placeholder + '"';
                if (filter.size) h += ' size="' + filter.size + '"';
                h += '>';
                break;

            default:
                h += '<input class="form-control form-control-sm" type="text" name="' + name + '"';
                if (filter.placeholder) h += ' placeholder="' + filter.placeholder + '"';
                if (filter.type === 'string' && validation.min !== undefined) h += ' minlength="' + validation.min + '"';
                if (filter.type === 'string' && validation.max !== undefined) h += ' maxlength="' + validation.max + '"';
                if (filter.size) h += ' size="' + filter.size + '"';
                h += '>';
        }
    }

    /**
     * Modifies the raw HTML of the rule's input
     * @event changer:getRuleInput
     * @memberof QueryBuilder
     * @param {string} html
     * @param {Rule} rule
     * @param {string} name - the name that the input must have
     * @returns {string}
     */
    return this.change('getRuleInput', h, rule, name);
};

export default QueryBuilder;