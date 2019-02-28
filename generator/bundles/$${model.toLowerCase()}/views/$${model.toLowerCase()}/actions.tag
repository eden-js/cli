<$${model.toLowerCase()}-actions>
  <div class="btn-group btn-group-sm" role="group">
    <a href="/admin/$${mount}/$${model.toLowerCase()}/{ opts.row.get('_id') }/update" class="btn btn-primary">
      <i class="fa fa-pencil" />
    </a>
    <a href="/admin/$${mount}/$${model.toLowerCase()}/{ opts.row.get('_id') }/remove" class="btn btn-danger">
      <i class="fa fa-times" />
    </a>
  </div>
</$${model.toLowerCase()}-actions>
