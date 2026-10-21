from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("wmlt_testlogs", "0004_alter_testrun_installation"),
    ]

    operations = [
        migrations.RenameField(
            model_name="eventexception",
            old_name="number",
            new_name="seqnr",
        ),
        migrations.AlterField(
            model_name="eventexception",
            name="seqnr",
            field=models.IntegerField(verbose_name="Sequence Number"),
        ),
    ]
