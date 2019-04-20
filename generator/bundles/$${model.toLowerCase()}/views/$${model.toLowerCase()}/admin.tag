<$${model.toLowerCase()}-admin-page>
  <div class="page page-fundraiser">

    <admin-header title="Manage $${model.charAt(0).toUpperCase() + model.slice(1).toLowerCase()}s">
      <yield to="right">
        <a href="/admin/$${mount}/$${model.toLowerCase()}/create" class="btn btn-lg btn-success">
          <i class="fa fa-plus ml-2"></i> Create $${model.charAt(0).toUpperCase() + model.slice(1).toLowerCase()}
        </a>
      </yield>
    </admin-header>

    <div class="container-fluid">

      <grid ref="grid" grid={ opts.grid } table-class="table table-striped table-bordered" title="$${model.charAt(0).toUpperCase() + model.slice(1).toLowerCase()} Grid" />

    </div>
  </div>
</$${model.toLowerCase()}-admin-page>
