<element-$${model.toLowerCase()}>
  <span each={ item, i in this.$${model.toLowerCase()}s }>
    <a href="/admin/$${mount}/$${model.toLowerCase()}/{ item.id }/update">{ item.name }</a>
    { i === this.$${model.toLowerCase()}s.length - 1 ? '' : ', ' }
  </span>
  
  <script>
    // set $${model.toLowerCase()}s
    this.$${model.toLowerCase()}s = (Array.isArray(opts.data.value) ? opts.data.value : [opts.data.value]).filter(v => v);
    
  </script>
</element-$${model.toLowerCase()}>
